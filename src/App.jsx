import { useState } from 'react';
import { Container } from '@mantine/core';
import { Providers } from './app/Providers.jsx';
import { SessionList } from './components/SessionList.jsx';
import { SessionEditor } from './components/SessionEditor.jsx';
import { PlayerScreen } from './components/PlayerScreen.jsx';
import { useSessions } from './hooks/useSessions.js';
import { useEngineState } from './hooks/useEngineState.js';
import { engine, youtube, YT_HOST_ID } from './app/runtime.js';
import { newSession } from './core/model.js';
import { notifySuccess } from './app/feedback.jsx';

/** Hosts the YouTube iframe. Always mounted (media survives view changes); only visible while playing. */
function YouTubeHost({ visible }) {
  const st = useEngineState(engine);
  const step = st.steps[st.idx];
  const isYt = st.status !== 'done' && step?.type === 'music' && step.source === 'yt';
  const cls = ['yt-wrap', !visible && 'offscreen', visible && !isYt && 'dim'].filter(Boolean).join(' ');
  return <div className={cls}><div id={YT_HOST_ID} className="yt-host" /></div>;
}

export function App() {
  const { sessions, save, remove, duplicate } = useSessions();
  const [view, setView] = useState({ name: 'list' });
  const toList = () => setView({ name: 'list' });

  return (
    <Providers>
      <Container size="sm" py="md" pb="xl">
        {view.name === 'list' && (
          <SessionList
            sessions={sessions}
            onNew={() => setView({ name: 'edit', session: newSession() })}
            onEdit={s => setView({ name: 'edit', session: s })}
            onPlay={s => { setView({ name: 'play' }); engine.start(s); }}
            onDuplicate={duplicate}
            onRemove={remove}
          />
        )}
        {view.name === 'edit' && (
          <SessionEditor
            key={view.session.id}
            session={view.session}
            youtube={youtube}
            onClose={toList}
            onSave={async s => { await save(s); notifySuccess('Séance enregistrée'); toList(); }}
          />
        )}
        {view.name === 'play' && <PlayerScreen engine={engine} onExit={toList} />}
        <YouTubeHost visible={view.name === 'play'} />
      </Container>
    </Providers>
  );
}
