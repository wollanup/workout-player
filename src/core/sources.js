/** Music sources a step can use. Order = order of the "add step" buttons and of the settings. */
export const SOURCES = [
  { id: 'yt', label: 'YouTube', color: 'red' },
  { id: 'apple', label: 'Apple Music', color: 'pink' },
  { id: 'local', label: 'Fichier', color: 'blue' },
];

export const SOURCES_KEY = 'wp.sources';

/** Sources whose tracks can be imported as a playlist. */
export const PLAYLIST_SOURCES = ['yt', 'apple'];

export const sourceMeta = id => SOURCES.find(s => s.id === id);

/**
 * Sources offered in the editor: enabled by the user (all by default) and available on this instance
 * (Apple Music needs a developer token). Never empty: falls back to every available source.
 * @param {Record<string, boolean>} prefs saved switches
 * @param {Record<string, boolean>} available
 * @returns {string[]}
 */
export function activeSources(prefs = {}, available = {}) {
  const usable = SOURCES.map(s => s.id).filter(id => available[id] !== false);
  const on = usable.filter(id => prefs[id] !== false);
  return on.length ? on : usable;
}
