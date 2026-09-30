import { confirm } from './feedback.jsx';

/** Asks before stopping a running session (no question once it is done). Resolves true to stop. */
export const confirmStop = engine => engine.getState().status === 'done'
  ? Promise.resolve(true)
  : confirm({ title: 'Arrêter la séance ?', confirmLabel: 'Arrêter', danger: true });
