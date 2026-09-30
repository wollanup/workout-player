/** Bracketed noise commonly found in YouTube titles: "(Official Video)", "[Lyrics]", "(Remastered 2011)"… */
const NOISE = /\s*[([][^)\]]*\b(?:official|video|audio|lyrics?|paroles|clip|visuali[sz]er|hd|hq|4k|remaster(?:ed)?|explicit|mv)\b[^)\]]*[)\]]/gi;
const SEPARATOR = /\s[-–—]\s/;

export function cleanTitle(title = '') {
  return title.replace(NOISE, '').replace(/\s{2,}/g, ' ').trim();
}

/** Channel name -> artist: "Daft Punk - Topic" (YT Music), "DaftPunkVEVO", "Daft Punk Official". */
export function cleanArtist(author = '') {
  return author
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/\s*VEVO$/i, '')
    .replace(/\s+Official$/i, '')
    .trim();
}

/** "Artiste - Titre" from YouTube metadata; keeps titles that already contain an artist. */
export function youTubeLabel({ title = '', author = '' } = {}) {
  const t = cleanTitle(title);
  if (!t) return cleanArtist(author);
  if (SEPARATOR.test(t)) return t;
  const artist = cleanArtist(author);
  return artist ? `${artist} - ${t}` : t;
}

/** "Artiste - Titre" from audio tags, falling back to the file name. */
export function localLabel({ artist, title } = {}, fileName = '') {
  if (title) return artist ? `${artist} - ${title}` : title;
  return fileName.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
}

/**
 * How a music step fits in its track, when the track duration is known.
 * `available`: playable seconds from `start`; `overrun` > 0: the step is longer
 * than what's left, so the track will restart from `start`.
 * @returns {{available: number, overrun: number}|null}
 */
export function trackFit(step) {
  if (step?.type !== 'music' || !(step.trackDuration > 0)) return null;
  const available = Math.max(0, Math.floor(step.trackDuration - (+step.start || 0)));
  return { available, overrun: (+step.duration || 0) - available };
}
