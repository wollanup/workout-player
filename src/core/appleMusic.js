/**
 * Apple Music links:
 *   song      https://music.apple.com/fr/song/harder-better-faster-stronger/697195787
 *   album     https://music.apple.com/fr/album/discovery/697194953           (?i=<songId> = one track of it)
 *   playlist  https://music.apple.com/fr/playlist/workout/pl.u-8aAVZAqsxLvXeA
 *   library   https://music.apple.com/library/playlist/p.ZOAXxLpC4kMB
 * Raw song IDs (digits) are accepted too.
 * @returns {{songId?: string, albumId?: string, playlistId?: string, library?: boolean, storefront?: string}}
 */
export function parseAppleMusic(input) {
  const s = String(input ?? '').trim();
  if (/^\d{5,}$/.test(s)) return { songId: s };
  let u;
  try { u = new URL(s); } catch { return {}; }
  if (!/(^|\.)music\.apple\.com$/.test(u.hostname)) return {};
  const parts = u.pathname.split('/').filter(Boolean);
  const out = {};
  if (/^[a-z]{2}$/.test(parts[0])) out.storefront = parts.shift();
  if (parts[0] === 'library') { out.library = true; parts.shift(); }
  const [kind] = parts;
  const id = parts.at(-1);
  const track = u.searchParams.get('i');
  if (kind === 'song' && /^\d+$/.test(id)) out.songId = id;
  else if (kind === 'album' && track && /^\d+$/.test(track)) out.songId = track;
  else if (kind === 'album' && /^(\d+|l\.\w+)$/.test(id)) out.albumId = id;
  else if (kind === 'playlist' && /^p(l)?\.[\w-]+$/.test(id)) out.playlistId = id;
  else return {};
  return out;
}

/** Song resource (catalog or library) -> step fields: id to play, "Artiste - Titre", duration, cover. */
export function appleTrack(song) {
  const a = song?.attributes ?? {};
  const label = a.artistName && a.name ? `${a.artistName} - ${a.name}` : (a.name ?? '');
  return {
    appleId: a.playParams?.catalogId ?? a.playParams?.id ?? song?.id,
    label,
    trackDuration: a.durationInMillis > 0 ? a.durationInMillis / 1000 : undefined,
    artwork: a.artwork?.url ? artworkUrl(a.artwork.url, 80) : undefined,
  };
}

/** Artwork URL templates contain "{w}x{h}". */
export const artworkUrl = (template, size) => template.replace('{w}', size).replace('{h}', size);

export const appleSongUrl = id => `https://music.apple.com/song/${id}`;
