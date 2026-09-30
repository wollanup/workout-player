import { useState } from 'react';
import {
  ActionIcon, Alert, Anchor, Badge, Button, Card, FileButton, Group, Loader, SimpleGrid, Stack, Text, TextInput,
} from '@mantine/core';
import { IconAlertTriangle, IconArrowDown, IconArrowUp, IconMusic, IconPlayerPause, IconTrash } from '@tabler/icons-react';
import { AppleField } from './AppleField.jsx';
import { DurationInput } from './DurationInput.jsx';
import { SecondsInput } from './SecondsInput.jsx';
import { parseYouTube } from '../core/youtube.js';
import { trackFit } from '../core/tracks.js';
import { MUSIC_PRESETS, PAUSE_PRESETS, formatTime } from '../core/time.js';
import { SOURCES } from '../core/sources.js';
import { SOURCE_ICONS } from '../app/sourceIcons.js';

const KIND = {
  pause: { label: 'Pause', color: 'orange', Icon: IconPlayerPause },
  ...Object.fromEntries(SOURCES.map(s => [s.id, { ...s, Icon: SOURCE_ICONS[s.id] }])),
  local: { label: 'Fichier local', color: 'blue', Icon: SOURCE_ICONS.local },
};

function YouTubeField({ step, onVideo }) {
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  function commit() {
    if (editing == null) return;
    const text = editing;
    setEditing(null);
    if (!text.trim()) return;
    const p = parseYouTube(text);
    if (!p.videoId) return setError('URL ou ID de vidéo invalide');
    setError(null);
    if (p.videoId !== step.videoId) onVideo(p);
  }

  return (
    <TextInput
      label="Vidéo"
      placeholder="https://music.youtube.com/watch?v=…"
      value={editing ?? (step.videoId ? `https://youtu.be/${step.videoId}` : '')}
      error={error || (!step.videoId && editing == null ? 'Colle une URL YouTube / YT Music' : null)}
      onFocus={e => { setEditing(e.currentTarget.value); e.currentTarget.select(); }}
      onChange={e => setEditing(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    />
  );
}

function FitWarning({ step, fit, onChange }) {
  if (!fit || fit.overrun <= 0) return null;
  const msg = fit.available <= 0
    ? `Le début (${formatTime(step.start)}) est après la fin du morceau (${formatTime(step.trackDuration)}).`
    : `Il ne reste que ${formatTime(fit.available)} de morceau après ${formatTime(step.start)} : il reprendra au début.`;
  return (
    <Alert color="yellow" variant="light" p="xs" icon={<IconAlertTriangle size={18} />}>
      <Text size="sm">{msg}</Text>
      {fit.available > 0 ? (
        <Anchor component="button" size="sm" onClick={() => onChange({ duration: fit.available })}>
          Ajuster la durée à {formatTime(fit.available)}
        </Anchor>
      ) : (
        <Anchor component="button" size="sm" onClick={() => onChange({ start: 0 })}>Démarrer au début</Anchor>
      )}
    </Alert>
  );
}

export function StepCard({ step, index, isFirst, isLast, analyzing, apple, onChange, onVideo, onMove, onRemove, onPickFile }) {
  const kind = KIND[step.type === 'pause' ? 'pause' : step.source];
  const fit = trackFit(step);

  return (
    <Card withBorder padding="sm" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${kind.color}-6)` }}>
      <Group justify="space-between" wrap="nowrap" mb="xs" gap={4}>
        <Group gap={4} wrap="nowrap" miw={0}>
          <kind.Icon size={20} color={`var(--mantine-color-${kind.color}-5)`} style={{ flexShrink: 0 }} />
          <Text fw={600} truncate>{index + 1}. {kind.label}</Text>
          {analyzing && <Loader size={14} aria-label="Analyse du morceau" />}
          {!analyzing && step.trackDuration > 0 && (
            <Badge size="md" variant="light" color="gray" leftSection={<IconMusic size={14} />} title="Durée du morceau"
              style={{ flexShrink: 0 }} styles={{ label: { overflow: 'visible' } }}>
              {formatTime(step.trackDuration)}
            </Badge>
          )}
        </Group>
        <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
          <ActionIcon variant="subtle" size="lg" disabled={isFirst} onClick={() => onMove(-1)} aria-label="Monter">
            <IconArrowUp size={20} />
          </ActionIcon>
          <ActionIcon variant="subtle" size="lg" disabled={isLast} onClick={() => onMove(1)} aria-label="Descendre">
            <IconArrowDown size={20} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" size="lg" onClick={onRemove} aria-label="Supprimer l’étape">
            <IconTrash size={20} />
          </ActionIcon>
        </Group>
      </Group>

      {step.type === 'pause' ? (
        <Stack gap="xs">
          <DurationInput label="Durée" value={step.duration} maxMinutes={5} presets={PAUSE_PRESETS}
            onChange={duration => onChange({ duration })} />
          <TextInput label="Libellé" placeholder="Pause" value={step.label}
            onChange={e => onChange({ label: e.currentTarget.value })} />
        </Stack>
      ) : (
        <Stack gap="xs">
          {step.source === 'yt' && <YouTubeField step={step} onVideo={onVideo} />}
          {step.source === 'apple' && <AppleField step={step} apple={apple} onTrack={onChange} />}
          {step.source === 'local' && (
            <Group wrap="nowrap" gap="xs">
              <Text size="sm" c={step.fileName ? undefined : 'red'} truncate style={{ flex: 1 }}>
                {step.fileName || 'Aucun fichier'}
              </Text>
              <FileButton accept="audio/*" onChange={f => f && onPickFile(f)}>
                {props => <Button variant="default" size="xs" {...props}>Choisir</Button>}
              </FileButton>
            </Group>
          )}
          <TextInput label="Titre" placeholder="Artiste - Titre" value={step.label}
            onChange={e => onChange({ label: e.currentTarget.value })} />
          <SimpleGrid cols={3} spacing="xs">
            <DurationInput
              label="Durée"
              value={step.duration}
              onChange={duration => onChange({ duration })}
              presets={MUSIC_PRESETS}
              maxMinutes={Math.max(10, Math.ceil((fit?.available ?? 0) / 60))}
              extra={(set, current) => fit && fit.available > 0 && (
                <Button size="compact-md" px={6} miw="fit-content" color="grape"
                  variant={fit.available === current ? 'filled' : 'light'}
                  leftSection={<IconMusic size={16} />} styles={{ section: { marginInlineEnd: 4 } }}
                  onClick={() => set(fit.available)}
                  aria-label={`Morceau entier (${formatTime(fit.available)})`} title="Jusqu’à la fin du morceau">
                  {formatTime(fit.available)}
                </Button>
              )}
            />
            <DurationInput label="Début à" min={0} value={step.start} onChange={start => onChange({ start })}
              maxMinutes={step.trackDuration > 0 ? Math.ceil(step.trackDuration / 60) : 10} />
            <SecondsInput label="Fondu" max={30} value={step.fade} onChange={fade => onChange({ fade })} />
          </SimpleGrid>
          <FitWarning step={step} fit={fit} onChange={onChange} />
        </Stack>
      )}
    </Card>
  );
}
