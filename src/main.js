import './styles.css';
import { $, showView } from './ui/dom.js';
import { newSession } from './core/model.js';
import { WorkoutEngine } from './player/engine.js';
import { createLocalAudioAdapter } from './media/localAudio.js';
import { createYouTubeAdapter } from './media/youtube.js';
import { createBeeper } from './media/beeper.js';
import { createWakeLock } from './services/wakeLock.js';
import { FileStore } from './services/storage.js';
import { mountListView } from './ui/listView.js';
import { mountEditView } from './ui/editView.js';
import { mountPlayView } from './ui/playView.js';

const youtube = createYouTubeAdapter('yt');
const engine = new WorkoutEngine({
  media: { yt: youtube, local: createLocalAudioAdapter($('#audio'), FileStore.get) },
  beeper: createBeeper(),
  wakeLock: createWakeLock(),
});

function goList() {
  list.render();
  showView('list');
}

const list = mountListView($('#view-list'), {
  onNew: () => { editor.open(newSession()); showView('edit'); },
  onEdit: s => { editor.open(s); showView('edit'); },
  onPlay: s => { showView('play'); engine.start(s); },
});
const editor = mountEditView($('#view-edit'), { youtube, onClose: goList });
mountPlayView(engine, { onExit: goList });

goList();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
