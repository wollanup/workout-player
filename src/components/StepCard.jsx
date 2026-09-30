import { useState } from 'react';
import {
  ActionIcon, Alert, Anchor, Badge, Button, Card, FileButton, Group, Loader, NumberInput, Stack, Text, TextInput,
} from '@mantine/core';
import {
  IconAlertTriangle, IconArrowDown, IconArrowUp, IconArrowsHorizontal, IconBrandYoutube, IconFileMusic,
  IconMusic, IconPlayerPause, IconTrash,
} from '@tabler/icons-react';
import { DurationInput } from './DurationInput.jsx';
import { parseYouTube } from '../core/youtube.js';
import { trackFit } from '../core/tracks.js';
import { formatTime } from '../core/time.js';

const KIND = {
  pause: { label: 'Pause', color: 'orange', Icon: IconPlayerPause },
  yt: { label: 'YouTube', color: 'red', Icon: IconBrandYoutube },
  local: { label: 'Fichier local', color: 'blue', Icon: IconFileMusic },
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

export function StepCard({ step, index, isFirst, isLast, analyzing, onChange, onVideo, onMove, onRemove, onPickFile }) {
  const kind = KIND[step.type === 'pause' ? 'pause' : step.source];
  const fit = trackFit(step);

  return (
    <Card withBorder padding="sm" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${kind.color}-6)` }}>
      <Group justify="space-between" wrap="nowrap" mb="xs">
        <Group gap={6} wrap="nowrap">
          <kind.Icon size={20} color={`var(--mantine-color-${kind.color}-5)`} />
          <Text fw={600} className="nowrap">{index + 1}. {kind.label}</Text>
          {analyzing && <Loader size={14} aria-label="Analyse du morceau" />}
          {!analyzing && step.trackDuration > 0 && (
            <Badge size="lg" variant="light" color="gray" leftSection={<IconMusic size={16} />} title="Durée du morceau"
              style={{ flexShrink: 0 }} styles={{ label: { overflow: 'visible' } }}>
              {formatTime(step.trackDuration)}
            </Badge>
          )}
        </Group>
        <Group gap={4} wrap="nowrap">
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
          <DurationInput label="Durée" value={step.duration} onChange={duration => onChange({ duration })} />
          <TextInput label="Libellé" placeholder="Pause" value={step.label}
            onChange={e => onChange({ label: e.currentTarget.value })} />
        </Stack>
      ) : (
        <Stack gap="xs">
          {step.source === 'yt' ? (
            <YouTubeField step={step} onVideo={onVideo} />
          ) : (
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
          <DurationInput
            label="Durée"
            value={step.duration}
            onChange={duration => onChange({ duration })}
            rightSection={fit && fit.available > 0 && fit.available !== step.duration && (
              <ActionIcon variant="light" size={36} onClick={() => onChange({ duration: fit.available })}
                aria-label="Jusqu’à la fin du morceau" title="Jusqu’à la fin du morceau">
                <IconArrowsHorizontal size={18} />
              </ActionIcon>
            )}
          />
          <Group gap="md" align="flex-end">
            <DurationInput label="Début à" min={0} value={step.start} onChange={start => onChange({ start })} />
            <NumberInput label="Fondu" suffix=" s" min={0} max={30} w={80} value={step.fade} allowDecimal={false}
              onChange={v => onChange({ fade: Math.max(0, +v || 0) })} />
          </Group>
          <FitWarning step={step} fit={fit} onChange={onChange} />
        </Stack>
      )}
    </Card>
  );
}
