import { useEffect, useRef, useState } from 'react';
import { AppShell, Container } from '@mantine/core';
import { Navigate, Outlet, useBlocker, useLocation, useMatch, useNavigate, useOutletContext, useParams } from 'react-router';
import { AppHeader } from '../components/shell/AppHeader.jsx';
import { SessionList } from '../components/SessionList.jsx';
import { SessionEditor } from '../components/SessionEditor.jsx';
import { PlayerScreen } from '../components/PlayerScreen.jsx';
import { useSessions } from '../hooks/useSessions.js';
import { useEngineState } from '../hooks/useEngineState.js';
import { apple, beeper, engine, youtube, YT_HOST_ID } from './runtime.js';
import { newSession, validateSession } from '../core/model.js';
import { notifyError } from './feedback.jsx';
import { confirmStop } from './stopSession.js';
import { closeDialog, dialogOpen } from './dialogs.js';

const editPath = id => `/s/${id}`;

/** Hosts the YouTube iframe. Always mounted (media survives view changes); only visible while playing. */
function YouTubeHost({ visible }) {
  const st = useEngineState(engine);
  const step = st.steps[st.idx];
  const isYt = st.status !== 'done' && step?.type === 'music' && step.source === 'yt';
  const cls = ['yt-wrap', !visible && 'offscreen', visible && !isYt && 'dim'].filter(Boolean).join(' ');
  return <div className={cls}><div id={YT_HOST_ID} className="yt-host" /></div>;
}

// Set while the app itself goes back: a confirmation may still be fading out, it must not block that.
let leaving = false;

/** Goes back in the app history, or to `fallback` when the app was opened on this page. */
function useLeave() {
  const navigate = useNavigate();
  return fallback => {
    if (!(history.state?.idx > 0)) return navigate(fallback, { replace: true });
    leaving = true;
    navigate(-1);
  };
}

const sessionRunning = () => ['running', 'paused'].includes(engine.getState().status);

/**
 * System back (Android button / gesture) follows the URL history. It is intercepted to close an open
 * dialog first, and to ask before quitting a running session.
 */
function useBackHandling() {
  const leave = useLeave();
  const blocker = useBlocker(({ currentLocation, historyAction }) => {
    if (leaving) return (leaving = false);
    return historyAction === 'POP'
      && (dialogOpen() || (!!matchPlay(currentLocation.pathname) && sessionRunning()));
  });
  const blocked = blocker.state === 'blocked';

  useEffect(() => {
    if (!blocked) return;
    blocker.reset();
    if (dialogOpen()) return closeDialog();
    confirmStop(engine).then(ok => {
      if (!ok) return;
      engine.stop();
      leave('/');
    });
  }, [blocked]); // eslint-disable-line react-hooks/exhaustive-deps
}

const matchPlay = path => /^\/s\/[^/]+\/play$/.test(path);

export function Layout() {
  const sessions = useSessions();
  const navigate = useNavigate();
  const leave = useLeave();
  const editing = useMatch('/s/:id');
  const playing = !!useMatch('/s/:id/play');
  useBackHandling();

  // Autosave keeps incomplete sessions, so check before playing.
  const play = s => {
    const errors = validateSession(s);
    if (errors.length) return notifyError(errors.join('\n'), 'Séance incomplète');
    engine.start(s);
    navigate(`${editPath(s.id)}/play`);
  };

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <Container size="sm" h="100%" px={0}>
          <AppHeader apple={apple} onHome={editing ? () => leave('/') : undefined} />
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="sm" py="md" pb="xl">
          <Outlet context={{ ...sessions, play, leave }} />
          <YouTubeHost visible={playing} />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export function ListRoute() {
  const { sessions, remove, duplicate, gc, play } = useOutletContext();
  const navigate = useNavigate();
  // Back on the list = the editor has flushed its autosave (unmount cleanup runs first): drop orphan files.
  useEffect(() => { gc(); }, [gc]);
  return (
    <SessionList
      sessions={sessions}
      // Not saved yet: the draft travels in the history state, so a reload keeps it.
      onNew={() => { const s = newSession(); navigate(editPath(s.id), { state: { session: s } }); }}
      onEdit={s => navigate(editPath(s.id))}
      onPlay={play}
      onDuplicate={duplicate}
      onRemove={remove}
    />
  );
}

export function EditRoute() {
  const { id } = useParams();
  const { state } = useLocation();
  const { sessions, save, play, leave } = useOutletContext();
  const [session] = useState(() => sessions.find(s => s.id === id) ?? state?.session);
  if (!session || session.id !== id) return <Navigate to="/" replace />;
  return (
    <SessionEditor
      key={id}
      session={session}
      youtube={youtube}
      apple={apple}
      beeper={beeper}
      onClose={() => leave('/')}
      onSave={save}
      onPlay={s => { save(s); play(s); }}
    />
  );
}

export function PlayRoute() {
  const { id } = useParams();
  const { leave } = useOutletContext();
  const exit = () => leave(editPath(id));
  // Reloaded mid-session: audio needs a new tap, so go back to the session instead.
  const orphan = useRef(engine.getState().status === 'idle');
  useEffect(() => { if (orphan.current) { orphan.current = false; exit(); } });
  if (engine.getState().status === 'idle') return null;
  return <PlayerScreen engine={engine} onExit={exit} />;
}
