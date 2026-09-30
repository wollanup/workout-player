import { useEffect, useState } from 'react';
import { AppShell, Container } from '@mantine/core';
import { Providers } from './app/Providers.jsx';
import { AppHeader } from './components/shell/AppHeader.jsx';
import { SessionList } from './components/SessionList.jsx';
import { SessionEditor } from './components/SessionEditor.jsx';
import { PlayerScreen } from './components/PlayerScreen.jsx';
import { useSessions } from './hooks/useSessions.js';
import { useEngineState } from './hooks/useEngineState.js';
import { beeper, engine, youtube, YT_HOST_ID } from './app/runtime.js';
import { newSession, validateSession } from './core/model.js';
import { notifyError } from './app/feedback.jsx';

/** Hosts the YouTube iframe. Always mounted (media survives view changes); only visible while playing. */
function YouTubeHost({ visible }) {
  const st = useEngineState(engine);
  const step = st.steps[st.idx];
  const isYt = st.status !== 'done' && step?.type === 'music' && step.source === 'yt';
  const cls = ['yt-wrap', !visible && 'offscreen', visible && !isYt && 'dim'].filter(Boolean).join(' ');
  return <div className={cls}><div id={YT_HOST_ID} className="yt-host" /></div>;
}

export function App() {
  const { sessions, save, remove, duplicate, gc } = useSessions();
  const [view, setView] = useState({ name: 'list' });
  // Autosave keeps incomplete sessions, so check before playing.
  const play = s => {
    const errors = validateSession(s);
    if (errors.length) return notifyError(errors.join('\n'), 'Séance incomplète');
    setView({ name: 'play' });
    engine.start(s);
  };

  // Back on the list = the editor has flushed its autosave (unmount cleanup runs first): drop orphan files.
  useEffect(() => { if (view.name === 'list') gc(); }, [view.name, gc]);
  const toList = () => setView({ name: 'list' });

  return (
    <Providers>
      <AppShell header={{ height: 60 }}>
        <AppShell.Header>
          <Container size="sm" h="100%" px={0}>
            <AppHeader onHome={view.name === 'edit' ? toList : undefined} />
          </Container>
        </AppShell.Header>
        <AppShell.Main>
          <Container size="sm" py="md" pb="xl">
            {view.name === 'list' && (
              <SessionList
                sessions={sessions}
                onNew={() => setView({ name: 'edit', session: newSession() })}
                onEdit={s => setView({ name: 'edit', session: s })}
                onPlay={play}
                onDuplicate={duplicate}
                onRemove={remove}
              />
            )}
            {view.name === 'edit' && (
              <SessionEditor
                key={view.session.id}
                session={view.session}
                youtube={youtube}
            beeper={beeper}
                onClose={toList}
                onSave={save}
                onPlay={s => { save(s); play(s); }}
              />
            )}
            {view.name === 'play' && <PlayerScreen engine={engine} onExit={toList} />}
            <YouTubeHost visible={view.name === 'play'} />
          </Container>
        </AppShell.Main>
      </AppShell>
    </Providers>
  );
}
