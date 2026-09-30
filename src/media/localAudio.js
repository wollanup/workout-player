/** Media adapter for audio files stored locally (Blobs in IndexedDB). */
export function createLocalAudioAdapter(audio, getBlob) {
  let cb = null;
  let start = 0;
  let seeked = false;
  let objectUrl = null;
  let cached = null; // { fileId, blob: Promise<Blob> } read ahead from IndexedDB

  audio.addEventListener('loadedmetadata', () => {
    if (seeked) return;
    seeked = true;
    if (start && start < audio.duration) audio.currentTime = start;
  });
  audio.addEventListener('playing', () => cb?.onPlaying());
  // Loop back to the chosen start point when the track is shorter than the step.
  audio.addEventListener('ended', () => {
    if (!cb) return;
    audio.currentTime = start;
    audio.play().catch(() => {});
  });
  audio.addEventListener('error', () => cb?.onError('Lecture du fichier impossible.'));

  return {
    prepare(step) {
      if (cached?.fileId === step.fileId) return;
      cached = { fileId: step.fileId, blob: getBlob(step.fileId).catch(() => null) };
    },
    async load(step, callbacks) {
      cb = callbacks;
      start = +step.start || 0;
      seeked = false;
      try {
        const blob = await (cached?.fileId === step.fileId ? cached.blob : getBlob(step.fileId));
        cached = null;
        if (cb !== callbacks) return;
        if (!blob) throw new Error('Fichier audio introuvable (réimporte-le dans l’éditeur).');
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(blob);
        audio.src = objectUrl;
        audio.volume = 1;
        await audio.play();
      } catch (err) {
        if (cb === callbacks) callbacks.onError(err.message);
      }
    },
    pause() { audio.pause(); },
    resume() { audio.play().catch(err => cb?.onError(err.message)); },
    stop() { cb = null; audio.pause(); },
    setVolume(v) { audio.volume = v; },
  };
}
