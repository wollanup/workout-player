import { $, esc } from './dom.js';
import { formatTime, parseTime } from '../core/time.js';
import { parseYouTube, fetchTitle } from '../core/youtube.js';
import { newMusic, newPause, totalDuration, uid, validateSession, stepsFromPlaylist } from '../core/model.js';
import { SessionStore, FileStore, gcFiles } from '../services/storage.js';

const KIND_LABEL = { pause: 'Pause', yt: 'YouTube', local: 'MP3 local' };

export function mountEditView(root, { youtube, onClose }) {
  let draft = null;
  let pickIndex = null;

  function stepHtml(s, i) {
    const last = draft.steps.length - 1;
    const kind = s.type === 'pause' ? 'pause' : s.source;
    const head = `<div class="step-head">
        <span class="badge ${kind}">${i + 1}. ${KIND_LABEL[kind]}</span>
        <span class="row">
          <button data-act="up" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Monter">↑</button>
          <button data-act="down" data-i="${i}" ${i === last ? 'disabled' : ''} aria-label="Descendre">↓</button>
          <button data-act="rm" data-i="${i}" aria-label="Supprimer">✕</button>
        </span></div>`;
    const dur = `<label>Durée (m:ss) <input data-i="${i}" data-sf="duration" value="${formatTime(s.duration)}" inputmode="numeric"></label>`;
    if (s.type === 'pause') {
      return `<li class="step pause">${head}<div class="grid2">${dur}
        <label>Libellé <input data-i="${i}" data-sf="label" value="${esc(s.label)}" placeholder="Pause"></label></div></li>`;
    }
    const src = s.source === 'yt'
      ? `<label>Vidéo (URL ou ID) <input data-i="${i}" data-sf="video" value="${s.videoId ? 'https://youtu.be/' + esc(s.videoId) : ''}"
           placeholder="https://music.youtube.com/watch?v=…" class="${s.videoId ? '' : 'invalid'}"></label>`
      : `<label>Fichier</label><div class="row"><span class="file-name">${esc(s.fileName || '— aucun —')}</span>
           <button data-act="pick" data-i="${i}">Choisir…</button></div>`;
    return `<li class="step">${head}${src}
      <label>Titre <input data-i="${i}" data-sf="label" value="${esc(s.label)}"></label>
      <div class="grid3">${dur}
        <label>Début à <input data-i="${i}" data-sf="start" value="${formatTime(s.start)}" inputmode="numeric"></label>
        <label>Fondu (s) <input type="number" min="0" data-i="${i}" data-sf="fade" value="${s.fade}"></label>
      </div></li>`;
  }

  function render() {
    const d = draft;
    root.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <button data-act="back">← Retour</button>
        <button class="primary" data-act="save">💾 Enregistrer</button>
      </div>
      <label>Nom <input data-f="name" value="${esc(d.name)}"></label>
      <div class="grid2">
        <label>Décompte de départ (s) <input type="number" min="0" data-f="lead" value="${d.lead}"></label>
        <label>Bips avant changement (s) <input type="number" min="0" max="15" data-f="countdown" value="${d.countdown}"></label>
      </div>
      <p class="muted">Durée totale : <b id="total">${formatTime(totalDuration(d))}</b></p>
      <ol class="steps">${d.steps.map(stepHtml).join('')}</ol>
      <div class="row wrap">
        <button data-act="add-yt">+ YouTube</button>
        <button data-act="add-local">+ MP3 local</button>
        <button data-act="add-pause">+ Pause</button>
      </div>
      <fieldset><legend>Importer une playlist YouTube / YT Music</legend>
        <label>URL de la playlist <input id="imp-url" placeholder="https://music.youtube.com/playlist?list=…"></label>
        <div class="grid2">
          <label>Durée par morceau <input id="imp-dur" value="3:00"></label>
          <label>Pause entre (0 = aucune) <input id="imp-pause" value="0:20"></label>
        </div>
        <div class="row"><button data-act="import">Importer</button><span id="imp-status" class="muted"></span></div>
      </fieldset>
      <input type="file" id="file-input" accept="audio/*" multiple hidden>`;
  }

  const updateTotal = () => { const t = $('#total', root); if (t) t.textContent = formatTime(totalDuration(draft)); };

  root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !draft) return;
    const i = +b.dataset.i;
    const steps = draft.steps;
    switch (b.dataset.act) {
      case 'back':
        if (confirm('Quitter sans enregistrer ?')) onClose();
        return;
      case 'save': return save();
      case 'import': return importPlaylist();
      case 'add-local': pickIndex = null; $('#file-input', root).click(); return;
      case 'pick': pickIndex = i; $('#file-input', root).click(); return;
      case 'add-yt': steps.push(newMusic('yt')); break;
      case 'add-pause': steps.push(newPause()); break;
      case 'up': [steps[i - 1], steps[i]] = [steps[i], steps[i - 1]]; break;
      case 'down': [steps[i + 1], steps[i]] = [steps[i], steps[i + 1]]; break;
      case 'rm': steps.splice(i, 1); break;
      default: return;
    }
    render();
  });

  root.addEventListener('change', async e => {
    const t = e.target;
    if (!draft) return;
    if (t.id === 'file-input') return onFiles(t);
    if (t.dataset.f) {
      draft[t.dataset.f] = t.type === 'number' ? Math.max(0, +t.value || 0) : t.value;
    } else if (t.dataset.sf) {
      const s = draft.steps[+t.dataset.i];
      const f = t.dataset.sf;
      if (f === 'duration' || f === 'start') {
        const v = parseTime(t.value);
        if (Number.isFinite(v) && (f === 'start' || v > 0)) s[f] = v;
        t.value = formatTime(s[f]);
      } else if (f === 'fade') {
        s.fade = Math.max(0, +t.value || 0);
      } else if (f === 'label') {
        s.label = t.value;
      } else if (f === 'video') {
        const p = parseYouTube(t.value);
        if (!p.videoId) { t.classList.add('invalid'); return; }
        s.videoId = p.videoId;
        if (p.start) s.start = p.start;
        s.label = (await fetchTitle(p.videoId)) || s.label;
        render();
      }
    }
    updateTotal();
  });

  async function onFiles(input) {
    const files = [...input.files];
    input.value = '';
    if (!files.length) return;
    navigator.storage?.persist?.();
    try {
      for (const [k, file] of files.entries()) {
        const fileId = uid();
        await FileStore.put(fileId, file);
        const label = file.name.replace(/\.[^.]+$/, '');
        if (pickIndex != null && k === 0) {
          const s = draft.steps[pickIndex];
          Object.assign(s, { fileId, fileName: file.name, label: s.label || label });
        } else {
          draft.steps.push(newMusic('local', { fileId, fileName: file.name, label }));
        }
      }
    } catch (err) {
      alert('Impossible d’enregistrer le fichier : ' + err.message);
    }
    render();
  }

  async function importPlaylist() {
    const status = msg => { $('#imp-status', root).textContent = msg; };
    const p = parseYouTube($('#imp-url', root).value);
    const dur = parseTime($('#imp-dur', root).value);
    const pause = parseTime($('#imp-pause', root).value) || 0;
    if (!p.list) return status('URL de playlist invalide.');
    if (!(dur > 0)) return status('Durée invalide.');
    status('Chargement de la playlist…');
    try {
      const ids = await youtube.playlistIds(p.list);
      const added = stepsFromPlaylist(ids, dur, pause);
      draft.steps.push(...added);
      render();
      status(`${ids.length} morceau(x) importé(s), récupération des titres…`);
      const music = added.filter(s => s.type === 'music');
      for (let k = 0; k < music.length; k += 6) {
        await Promise.all(music.slice(k, k + 6).map(async s => { s.label = await fetchTitle(s.videoId); }));
      }
      render();
      status(`${ids.length} morceau(x) importé(s).`);
    } catch (err) {
      status('Erreur : ' + err.message);
    }
  }

  async function save() {
    draft.name = draft.name.trim() || 'Séance';
    const errors = validateSession(draft);
    if (errors.length) return alert(errors.join('\n'));
    SessionStore.upsert(draft);
    await gcFiles();
    onClose();
  }

  return {
    open(session) {
      draft = structuredClone(session);
      render();
    },
  };
}
