import { ytErrorMessage } from '../core/youtube.js';

const PLAYING = 1;
const ENDED = 0;

/**
 * YouTube IFrame API wrapper + media adapter.
 * Error 153 happens when YouTube gets no Referer: the page must be served over http(s)
 * with a referrer policy that sends the origin (see <meta name="referrer"> in index.html).
 */
/** @param {() => HTMLElement|null} getContainer element that will host the player iframe */
export function createYouTubeAdapter(getContainer) {
  let ready = null;
  let player = null;
  let cb = null;
  let start = 0;

  function load() {
    ready ??= new Promise((resolve, reject) => {
      if (location.protocol === 'file:') {
        return reject(new Error(ytErrorMessage(153)));
      }
      const create = () => {
        const host = getContainer();
        if (!host) {
          return reject(new Error('Lecteur YouTube non monté.'));
        }
        // Imperative child: React never renders inside the host, so YT can replace it with its iframe.
        const el = document.createElement('div');
        host.replaceChildren(el);
        player = new YT.Player(el, {
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0, origin: location.origin },
          events: {
            onReady: () => resolve(player),
            onStateChange: e => onState(e.data),
            onError: e => cb?.onError(ytErrorMessage(e.data)),
          },
        });
      };
      if (window.YT?.Player) return create();
      window.onYouTubeIframeAPIReady = create;
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => { s.remove(); reject(new Error('API YouTube injoignable (hors ligne ?)')); };
      document.head.append(s);
    }).catch(err => {
      ready = null; // allow retry
      throw err;
    });
    return ready;
  }

  function onState(st) {
    if (!cb) return;
    if (st === PLAYING) {
      if (player.isMuted()) player.unMute();
      cb.onPlaying();
    } else if (st === ENDED) {
      player.seekTo(start, true);
      player.playVideo();
    }
  }

  const safe = fn => { try { fn(); } catch { /* player not ready yet */ } };

  return {
    stallHint: 'La vidéo ne démarre pas : touche le lecteur ci-dessous.',
    preload: () => load().catch(() => {}),
    async load(step, callbacks) {
      cb = callbacks;
      start = +step.start || 0;
      try {
        const p = await load();
        if (cb !== callbacks) return;
        p.unMute();
        p.setVolume(100);
        p.loadVideoById({ videoId: step.videoId, startSeconds: start });
      } catch (err) {
        if (cb === callbacks) callbacks.onError(err.message);
      }
    },
    pause: () => safe(() => player?.pauseVideo()),
    resume: () => safe(() => player?.playVideo()),
    stop() { cb = null; safe(() => player?.pauseVideo()); },
    setVolume: v => safe(() => player?.setVolume(Math.round(v * 100))),

    /** Reads a playlist's video IDs through the embedded player (no API key needed). */
    async playlistIds(list, timeoutMs = 15000) {
      const p = await load();
      p.cuePlaylist({ listType: 'playlist', list });
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 300));
        const ids = p.getPlaylist?.();
        if (ids?.length) { p.stopVideo(); return ids; }
      }
      throw new Error('playlist introuvable, vide ou privée.');
    },
  };
}
