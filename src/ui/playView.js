import { $ } from './dom.js';
import { formatTime } from '../core/time.js';
import { stepTitle } from '../core/model.js';

/** Renders the engine state; the only piece bound to the DOM for playback. */
export function mountPlayView(engine, { onExit }) {
  const el = {
    session: $('#play-session'), label: $('#play-step-label'), timer: $('#play-timer'),
    progress: $('#play-progress'), info: $('#play-info'), next: $('#play-next'),
    error: $('#play-error'), toggle: $('#btn-toggle'), yt: $('#yt-wrap'),
  };

  function render(st) {
    if (st.status === 'idle') return;
    el.session.textContent = st.session.name;
    el.error.textContent = st.error;
    if (st.status === 'done') {
      document.body.dataset.mode = 'done';
      el.label.textContent = 'Séance terminée 🎉';
      el.timer.textContent = '0:00';
      el.timer.classList.remove('waiting');
      el.progress.style.width = '100%';
      el.info.textContent = '';
      el.next.textContent = '';
      el.toggle.textContent = '↺';
      el.yt.classList.add('dim');
      return;
    }
    const step = st.steps[st.idx];
    if (!step) return;
    const offset = st.hasLead ? 1 : 0;
    const pos = st.idx - offset + 1;
    const left = st.remaining + st.steps.slice(st.idx + 1).reduce((a, x) => a + (+x.duration || 0), 0);
    const next = st.steps[st.idx + 1];
    document.body.dataset.mode = step.type === 'pause' ? 'pause' : 'music';
    el.label.textContent = stepTitle(step);
    el.timer.textContent = formatTime(st.remaining);
    el.timer.classList.toggle('waiting', !st.ready || st.status === 'paused');
    el.progress.style.width = (st.duration ? 100 * (1 - st.remaining / st.duration) : 0) + '%';
    el.info.textContent = pos > 0
      ? `Étape ${pos}/${st.steps.length - offset} · reste ${formatTime(left)}`
      : `Départ dans ${formatTime(st.remaining)}`;
    el.next.textContent = next ? `Ensuite : ${stepTitle(next)} (${formatTime(next.duration)})` : 'Dernière étape';
    el.toggle.textContent = st.status === 'paused' ? '▶' : '⏸';
    el.yt.classList.toggle('dim', !(step.type === 'music' && step.source === 'yt'));
  }

  engine.subscribe(render);

  $('#btn-stop').addEventListener('click', () => {
    if (engine.state.status === 'done' || confirm('Arrêter la séance ?')) {
      engine.stop();
      onExit();
    }
  });
  $('#btn-toggle').addEventListener('click', () => engine.togglePause());
  $('#btn-next').addEventListener('click', () => engine.next());
  $('#btn-prev').addEventListener('click', () => engine.prev());

  // Headset / lock-screen buttons (effective with local audio).
  const ms = navigator.mediaSession;
  const set = (a, fn) => { try { ms?.setActionHandler(a, fn); } catch { /* unsupported action */ } };
  set('play', () => engine.state.status === 'paused' && engine.togglePause());
  set('pause', () => engine.state.status === 'running' && engine.togglePause());
  set('nexttrack', () => engine.next());
  set('previoustrack', () => engine.prev());
}
