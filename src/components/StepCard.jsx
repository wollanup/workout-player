import { useState } from 'react';
import { ActionIcon, Button, Card, FileButton, Group, NumberInput, SimpleGrid, Text, TextInput } from '@mantine/core';
import {
  IconArrowDown, IconArrowUp, IconBrandYoutube, IconFileMusic, IconPlayerPause, IconTrash,
} from '@tabler/icons-react';
import { TimeInput } from './TimeInput.jsx';
import { parseYouTube, fetchTitle } from '../core/youtube.js';

const KIND = {
  pause: { label: 'Pause', color: 'orange', Icon: IconPlayerPause },
  yt: { label: 'YouTube', color: 'red', Icon: IconBrandYoutube },
  local: { label: 'Fichier local', color: 'blue', Icon: IconFileMusic },
};

function YouTubeField({ step, onChange }) {
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(step.videoId ? null : 'Colle une URL YouTube / YT Music');

  async function commit() {
    if (editing == null) return;
    const text = editing;
    setEditing(null);
    const p = parseYouTube(text);
    if (!p.videoId) return setError('URL ou ID de vidéo invalide');
    setError(null);
    if (p.videoId === step.videoId) return;
    onChange({ videoId: p.videoId, ...(p.start ? { start: p.start } : {}) });
    const title = await fetchTitle(p.videoId);
    if (title) onChange({ label: title });
  }

  return (
    <TextInput
      label="Vidéo"
      placeholder="https://music.youtube.com/watch?v=…"
      value={editing ?? (step.videoId ? `https://youtu.be/${step.videoId}` : '')}
      error={error}
      onFocus={e => { setEditing(e.currentTarget.value); e.currentTarget.select(); }}
      onChange={e => setEditing(e.currentTarget.value)}
      onBlur={commit}
      onPaste={e => { const t = e.clipboardData.getData('text'); if (t) { e.preventDefault(); setEditing(t); } }}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    />
  );
}

export function StepCard({ step, index, isFirst, isLast, onChange, onMove, onRemove, onPickFile }) {
  const kind = KIND[step.type === 'pause' ? 'pause' : step.source];
  const duration = <TimeInput label="Durée" value={step.duration} onChange={duration => onChange({ duration })} />;

  return (
    <Card withBorder padding="sm" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${kind.color}-6)` }}>
      <Group justify="space-between" wrap="nowrap" mb="xs">
        <Group gap={6} wrap="nowrap">
          <kind.Icon size={20} color={`var(--mantine-color-${kind.color}-5)`} />
          <Text fw={600}>{index + 1}. {kind.label}</Text>
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
        <SimpleGrid cols={2}>
          {duration}
          <TextInput label="Libellé" placeholder="Pause" value={step.label}
            onChange={e => onChange({ label: e.currentTarget.value })} />
        </SimpleGrid>
      ) : (
        <>
          {step.source === 'yt' ? (
            <YouTubeField step={step} onChange={onChange} />
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
          <TextInput mt="xs" label="Titre" value={step.label} onChange={e => onChange({ label: e.currentTarget.value })} />
          <SimpleGrid cols={3} mt="xs">
            {duration}
            <TimeInput label="Début à" allowZero value={step.start} onChange={start => onChange({ start })} />
            <NumberInput label="Fondu (s)" min={0} max={30} value={step.fade} allowDecimal={false}
              onChange={v => onChange({ fade: Math.max(0, +v || 0) })} />
          </SimpleGrid>
        </>
      )}
    </Card>
  );
}
