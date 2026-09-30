import { WorkoutEngine } from '../player/engine.js';
import { createLocalAudioAdapter } from '../media/localAudio.js';
import { createYouTubeAdapter } from '../media/youtube.js';
import { createAppleMusicAdapter } from '../media/appleMusic.js';
import { createBeeper } from '../media/beeper.js';
import { createWakeLock } from '../services/wakeLock.js';
import { FileStore } from '../services/storage.js';

/** DOM id of the element hosting the YouTube iframe (rendered once by <YouTubeHost />). */
export const YT_HOST_ID = 'yt-host';

/** App-wide singletons: media must survive view changes, so they live outside React. */
export const youtube = createYouTubeAdapter(() => document.getElementById(YT_HOST_ID));

/** Apple Music is only available when the build embeds a developer token (see docs/DEVELOPMENT.md). */
export const apple = createAppleMusicAdapter({ developerToken: import.meta.env.VITE_APPLE_MUSIC_TOKEN });

export const beeper = createBeeper();

export const engine = new WorkoutEngine({
  media: { yt: youtube, apple, local: createLocalAudioAdapter(new Audio(), FileStore.get) },
  beeper,
  wakeLock: createWakeLock(),
});

// Headset / lock-screen buttons (effective with local audio).
const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : null;
const setAction = (a, fn) => { try { ms?.setActionHandler(a, fn); } catch { /* unsupported action */ } };
setAction('play', () => engine.state.status === 'paused' && engine.togglePause());
setAction('pause', () => engine.state.status === 'running' && engine.togglePause());
setAction('nexttrack', () => engine.next());
setAction('previoustrack', () => engine.prev());
