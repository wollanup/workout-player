import { esc } from './dom.js';
import { formatTime } from '../core/time.js';
import { totalDuration, uid } from '../core/model.js';
import { SessionStore, gcFiles } from '../services/storage.js';

export function mountListView(root, { onNew, onEdit, onPlay }) {
  function render() {
    const sessions = SessionStore.all();
    root.innerHTML = `
      <div class="row"><button class="primary" data-act="new">+ Nouvelle séance</button></div>
      ${sessions.length ? '' : '<p class="muted">Aucune séance pour l’instant.</p>'}
      <ul class="cards">${sessions.map(s => `
        <li class="card">
          <div><strong>${esc(s.name)}</strong>
            <div class="muted">${s.steps.length} étape(s) · ${formatTime(totalDuration(s))}</div></div>
          <div class="row">
            <button class="primary" data-act="play" data-id="${s.id}" aria-label="Lancer">▶</button>
            <button data-act="edit" data-id="${s.id}" aria-label="Modifier">✎</button>
            <button data-act="dup" data-id="${s.id}" aria-label="Dupliquer">⧉</button>
            <button data-act="del" data-id="${s.id}" aria-label="Supprimer">🗑</button>
          </div>
        </li>`).join('')}</ul>
      <details class="help"><summary>Aide</summary>
        <ul>
          <li><b>YouTube</b> : colle l’URL d’une vidéo (youtube.com, music.youtube.com, youtu.be). Connecte-toi à YouTube dans ce navigateur pour profiter de Premium (sans pub).</li>
          <li><b>Playlist</b> : elle doit être publique ou non répertoriée (les playlists privées, comme « J’aime », ne sont pas lisibles par le lecteur intégré).</li>
          <li>Certains clips interdisent la lecture intégrée : le lecteur l’indique et le temps continue en silence.</li>
          <li><b>MP3 local</b> : le fichier est copié dans le stockage du navigateur (hors ligne, écran éteint OK).</li>
          <li>Avec YouTube, l’écran reste allumé pendant la séance (nécessite HTTPS).</li>
        </ul>
      </details>`;
  }

  root.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    const { act, id } = b.dataset;
    if (act === 'new') onNew();
    else if (act === 'edit') onEdit(SessionStore.get(id));
    else if (act === 'play') onPlay(SessionStore.get(id));
    else if (act === 'dup') {
      const s = structuredClone(SessionStore.get(id));
      s.id = uid();
      s.name += ' (copie)';
      s.steps.forEach(x => { x.id = uid(); });
      SessionStore.upsert(s);
      render();
    } else if (act === 'del') {
      if (!confirm('Supprimer cette séance ?')) return;
      SessionStore.remove(id);
      await gcFiles();
      render();
    }
  });

  return { render };
}
