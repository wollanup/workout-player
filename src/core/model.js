export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/**
 * @typedef {{id: string, type: 'pause', label: string, duration: number, lead?: boolean}} PauseStep
 * @typedef {{id: string, type: 'music', source: 'yt'|'local', label: string, duration: number,
 *   start: number, fade: number, videoId?: string, fileId?: string, fileName?: string}} MusicStep
 * @typedef {PauseStep|MusicStep} Step
 * @typedef {{id: string, name: string, lead: number, countdown: number, steps: Step[]}} Session
 */

/** @returns {Session} */
export const newSession = () => ({ id: uid(), name: 'Nouvelle séance', lead: 5, countdown: 5, steps: [] });

/** @returns {MusicStep} */
export const newMusic = (source, extra = {}) =>
  ({ id: uid(), type: 'music', source, label: '', duration: 180, start: 0, fade: 3, ...extra });

/** @returns {PauseStep} */
export const newPause = (duration = 20) => ({ id: uid(), type: 'pause', label: '', duration });

export const totalDuration = s => (+s.lead || 0) + s.steps.reduce((a, x) => a + (+x.duration || 0), 0);

export const stepTitle = s => s.type === 'pause'
  ? (s.label || 'Pause')
  : (s.label || s.fileName || s.videoId || 'Morceau');

/** Steps actually played: optional "get ready" lead pause + session steps. */
export function buildRunSteps(session) {
  const lead = +session.lead || 0;
  const steps = session.steps.filter(s => +s.duration > 0);
  return lead > 0 && steps.length
    ? [{ id: 'lead', type: 'pause', label: 'Préparez-vous', duration: lead, lead: true }, ...steps]
    : steps;
}

/** @returns {string[]} human readable errors, empty when valid */
export function validateSession(session) {
  const errors = [];
  if (!session.steps.length) errors.push('Ajoute au moins une étape.');
  session.steps.forEach((s, i) => {
    if (!(+s.duration > 0)) errors.push(`Étape ${i + 1} : durée invalide.`);
    if (s.type === 'music' && (s.source === 'yt' ? !s.videoId : !s.fileId)) {
      errors.push(`Étape ${i + 1} : aucune musique sélectionnée.`);
    }
  });
  return errors;
}

/** Builds steps from a list of YouTube IDs, with optional pauses in between. */
export function stepsFromPlaylist(videoIds, duration, pause = 0) {
  return videoIds.flatMap((videoId, k) => [
    ...(k > 0 && pause > 0 ? [newPause(pause)] : []),
    newMusic('yt', { videoId, duration }),
  ]);
}
