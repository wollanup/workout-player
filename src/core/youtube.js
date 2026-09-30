/** YouTube "t" parameter: "90", "90s", "1m30s", "1h2m3s" -> seconds. */
export function parseYtT(t) {
  if (!t) return 0;
  if (/^\d+s?$/.test(t)) return parseInt(t, 10);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
}

/**
 * Accepts video/playlist URLs (youtube.com, music.youtube.com, youtu.be, shorts…) or raw IDs.
 * @returns {{videoId?: string, list?: string, start?: number}}
 */
export function parseYouTube(input) {
  const s = String(input ?? '').trim();
  if (/^[\w-]{11}$/.test(s)) return { videoId: s };
  if (/^(PL|OL|RD|UU|FL|LL|VL)[\w-]{10,}$/.test(s)) return { list: s.replace(/^VL/, '') };
  let u;
  try { u = new URL(s); } catch { return {}; }
  if (!/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(u.hostname)) return {};
  const out = {};
  const v = u.searchParams.get('v');
  if (v && /^[\w-]{11}$/.test(v)) out.videoId = v;
  const list = u.searchParams.get('list');
  if (list) out.list = list.replace(/^VL/, '');
  if (!out.videoId) {
    const m = u.hostname.endsWith('youtu.be')
      ? u.pathname.match(/^\/([\w-]{11})/)
      : u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);
    if (m) out.videoId = m[1];
  }
  const start = parseYtT(u.searchParams.get('t') || u.searchParams.get('start'));
  if (start) out.start = start;
  return out;
}

export async function fetchTitle(videoId, fetchImpl = globalThis.fetch) {
  try {
    const watch = 'https://www.youtube.com/watch?v=' + videoId;
    const res = await fetchImpl(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`);
    if (!res.ok) return '';
    return (await res.json()).title || '';
  } catch {
    return '';
  }
}

export const YT_ERRORS = {
  2: 'Identifiant de vidéo invalide.',
  5: 'Erreur du lecteur HTML5.',
  100: 'Vidéo introuvable ou privée.',
  101: 'Lecture intégrée interdite par le propriétaire de la vidéo.',
  150: 'Lecture intégrée interdite par le propriétaire de la vidéo.',
  153: 'Lecteur mal configuré (referrer manquant) : ouvre l’app via le serveur (npm run dev), pas en file://.',
};

export const ytErrorMessage = code => YT_ERRORS[code] || `Erreur YouTube ${code}.`;
