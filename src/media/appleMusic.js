import { appleTrack } from '../core/appleMusic.js';

const SCRIPT = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
const MAX_TRACKS = 300;

// MusicKit.PlaybackStates values (stable across v1..v3).
const PLAYING = 2;
const ENDED = 5;
const COMPLETED = 10;

/**
 * Apple Music through MusicKit JS v3: media adapter for the engine + catalog / library helpers for the editor.
 * Needs a developer token (JWT signed with a MusicKit key, see docs/DEVELOPMENT.md): without it the
 * service reports `configured: false` and the source is hidden. Full-length playback requires the user
 * to sign in with an Apple Music subscription (authorize()).
 *
 * @param {{developerToken?: string, appName?: string, win?: Window}} options
 */
export function createAppleMusicAdapter({ developerToken, appName = 'Workout Player', win = globalThis.window } = {}) {
  let ready = null;
  let music = null;
  let cb = null;
  let start = 0;
  let seekPending = false;
  /** Song queued (paused) while the player is idle, e.g. during a rest step. */
  let prepared = null;
  const listeners = new Set();
  const notify = () => listeners.forEach(fn => fn());

  function load() {
    ready ??= new Promise((resolve, reject) => {
      if (!developerToken) return reject(new Error('Apple Music n’est pas configuré sur cette installation.'));
      const init = async () => {
        try {
          const m = await win.MusicKit.configure({ developerToken, app: { name: appName, build: '1' } });
          m.addEventListener('playbackStateDidChange', onState);
          m.addEventListener('mediaPlaybackError', e => cb?.onError(playbackError(e)));
          m.addEventListener('authorizationStatusDidChange', notify);
          music = m;
          notify();
          resolve(m);
        } catch (err) {
          reject(new Error(`Apple Music indisponible : ${err?.message || err}`));
        }
      };
      if (win.MusicKit?.configure) return init();
      win.document.addEventListener('musickitloaded', init, { once: true });
      const s = win.document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      s.onerror = () => { s.remove(); reject(new Error('Apple Music injoignable (hors ligne ?)')); };
      win.document.head.append(s);
    }).catch(err => {
      ready = null; // allow retry
      throw err;
    });
    return ready;
  }

  function onState({ state }) {
    if (!cb) return;
    if (state === PLAYING) {
      if (seekPending) {
        seekPending = false;
        if (start > 0) music.seekToTime(start).catch(() => {});
      }
      cb.onPlaying();
    } else if (state === ENDED || state === COMPLETED) {
      // Loop back to the chosen start point when the track is shorter than the step.
      music.seekToTime(start).then(() => music.play()).catch(() => {});
    }
  }

  const playbackError = e => {
    const msg = e?.error?.message || e?.message || '';
    return /subscription|authoriz/i.test(msg)
      ? 'Abonnement Apple Music requis pour la lecture complète.'
      : `Lecture Apple Music impossible${msg ? ` (${msg})` : ''}.`;
  };

  /** Calls the Apple Music API (catalog paths may use {{storefrontId}}). Follows pagination for lists. */
  async function api(path, params, { all = false } = {}) {
    const m = await load();
    const { data } = await m.api.music(path, params);
    if (!all) return data;
    const items = [...(data.data ?? [])];
    let next = data.next;
    while (next && items.length < MAX_TRACKS) {
      const { data: page } = await m.api.music(next);
      items.push(...(page.data ?? []));
      next = page.next;
    }
    return items;
  }

  const storefront = sf => sf || '{{storefrontId}}';
  const safe = fn => { try { return fn(); } catch { /* not loaded yet */ } };

  return {
    configured: !!developerToken,
    stallHint: 'Apple Music ne démarre pas : vérifie ta connexion à Apple Music.',

    // --- account -------------------------------------------------------------------------------------
    /** Loads MusicKit (no sign-in); resolves false when unavailable. */
    init: () => load().then(() => true, () => false),
    isAuthorized: () => !!music?.isAuthorized,
    async authorize() {
      const m = await load();
      await m.authorize();
      notify();
    },
    async unauthorize() {
      await music?.unauthorize();
      notify();
    },
    /** Re-renders subscribers when MusicKit loads or the sign-in state changes. */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    // --- media adapter -------------------------------------------------------------------------------
    preload: () => load().catch(() => {}),
    prepare(step) {
      if (cb || prepared === step.appleId || !music?.isAuthorized) return;
      prepared = step.appleId;
      music.setQueue({ song: step.appleId, startPlaying: false }).catch(() => { prepared = null; });
    },
    async load(step, callbacks) {
      cb = callbacks;
      start = +step.start || 0;
      seekPending = true;
      const reuse = prepared === step.appleId;
      prepared = null;
      try {
        const m = await load();
        if (cb !== callbacks) return;
        if (!m.isAuthorized) throw new Error('Connecte ton compte Apple Music (menu > Sources).');
        m.volume = 1;
        if (!reuse) await m.setQueue({ song: step.appleId, startPlaying: false });
        if (cb !== callbacks) return;
        await m.play();
      } catch (err) {
        if (cb === callbacks) callbacks.onError(err.message);
      }
    },
    pause: () => safe(() => music?.pause()),
    resume: () => safe(() => music?.play()?.catch?.(err => cb?.onError(err.message))),
    stop() {
      cb = null;
      if (music?.playbackState === PLAYING) safe(() => music.pause());
    },
    setVolume: v => safe(() => { if (music) music.volume = v; }),

    // --- catalog / library ---------------------------------------------------------------------------
    /** @returns {Promise<{appleId: string, label: string, trackDuration?: number}|null>} */
    async song(id, sf) {
      const path = /^i\./.test(id) ? `/v1/me/library/songs/${id}` : `/v1/catalog/${storefront(sf)}/songs/${id}`;
      const data = await api(path);
      return data.data?.[0] ? appleTrack(data.data[0]) : null;
    },
    /** Catalog search (no sign-in needed). */
    async search(term, limit = 8) {
      const data = await api(`/v1/catalog/{{storefrontId}}/search`, { term, types: 'songs', limit });
      return (data.results?.songs?.data ?? []).map(appleTrack);
    },
    /** Tracks of a catalog / library playlist or album (see parseAppleMusic). */
    async tracks({ playlistId, albumId, library, storefront: sf }) {
      const kind = playlistId ? 'playlists' : 'albums';
      const id = playlistId ?? albumId;
      const base = library || /^p\./.test(id) || /^l\./.test(id)
        ? `/v1/me/library/${kind}/${id}`
        : `/v1/catalog/${storefront(sf)}/${kind}/${id}`;
      const items = await api(`${base}/tracks`, { limit: 100 }, { all: true });
      return items.filter(t => /songs$/.test(t.type)).map(appleTrack);
    },
    /** The user's own playlists (sign-in required). */
    async libraryPlaylists() {
      const items = await api('/v1/me/library/playlists', { limit: 100 }, { all: true });
      return items.map(p => ({ id: p.id, name: p.attributes?.name ?? p.id }));
    },
  };
}
