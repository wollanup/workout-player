import { ActionIcon, Alert, Group, Progress, Stack, Text, Title } from '@mantine/core';
import {
  IconAlertTriangle, IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled, IconRotateClockwise, IconTrophy, IconX,
} from '@tabler/icons-react';
import { useEngineState } from '../hooks/useEngineState.js';
import { formatTime } from '../core/time.js';
import { stepTitle } from '../core/model.js';
import { confirmStop } from '../app/stopSession.js';
import { sessionProgress } from '../player/progress.js';

export function PlayerScreen({ engine, onExit }) {
  const st = useEngineState(engine);
  if (st.status === 'idle') return null;

  const done = st.status === 'done';
  const step = st.steps[st.idx];
  const next = st.steps[st.idx + 1];
  const offset = st.hasLead ? 1 : 0;
  const pos = st.idx - offset + 1;
  const color = done ? 'green' : step?.lead ? 'blue' : step?.type === 'pause' ? 'orange' : 'green';
  const { total, elapsed, left } = sessionProgress(st);
  const waiting = !done && (!st.ready || st.status === 'paused');

  async function stop() {
    if (await confirmStop(engine)) {
      engine.stop();
      onExit();
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="nowrap">
        <ActionIcon variant="default" size="xl" onClick={stop} aria-label="Arrêter">
          <IconX />
        </ActionIcon>
        <Text fw={600} truncate>{st.session.name}</Text>
        <Text c="dimmed" className="nowrap" data-testid="session-total">
          {formatTime(elapsed)} / {formatTime(total)}
        </Text>
      </Group>

      <Progress value={total ? (100 * elapsed) / total : 0} size="sm" color="gray" aria-label="Progression de la séance" />

      <Title order={2} ta="center" mt="md" lineClamp={2}>
        {done ? <><IconTrophy size={28} style={{ verticalAlign: -4 }} /> Séance terminée</> : stepTitle(step)}
      </Title>

      <Text className="timer" ta="center" c={color} style={{ opacity: waiting ? 0.45 : 1 }}>
        {formatTime(done ? 0 : st.remaining)}
      </Text>

      <Progress value={done ? 100 : st.duration ? 100 * (1 - st.remaining / st.duration) : 0} size="lg" radius={999} color={color} />

      {!done && (
        <Text ta="center" c="dimmed">
          {pos > 0 ? `Étape ${pos}/${st.steps.length - offset}` : 'Départ imminent'} · reste {formatTime(left)}
        </Text>
      )}

      <Group justify="center" gap="lg" my="md">
        <ActionIcon variant="default" size={64} radius={999} onClick={() => engine.prev()} disabled={done} aria-label="Étape précédente">
          <IconPlayerSkipBackFilled size={28} />
        </ActionIcon>
        <ActionIcon size={88} radius={999} color={color} onClick={() => engine.togglePause()} aria-label={done ? 'Recommencer' : 'Pause / lecture'}>
          {done ? <IconRotateClockwise size={40} />
            : st.status === 'paused' ? <IconPlayerPlayFilled size={40} /> : <IconPlayerPauseFilled size={40} />}
        </ActionIcon>
        <ActionIcon variant="default" size={64} radius={999} onClick={() => engine.next()} disabled={done} aria-label="Étape suivante">
          <IconPlayerSkipForwardFilled size={28} />
        </ActionIcon>
      </Group>

      {!done && (
        <Text ta="center" c="dimmed">
          {next ? `Ensuite : ${stepTitle(next)} (${formatTime(next.duration)})` : 'Dernière étape'}
        </Text>
      )}

      {st.error && (
        <Alert color="red" icon={<IconAlertTriangle />} variant="light">{st.error}</Alert>
      )}
    </Stack>
  );
}
