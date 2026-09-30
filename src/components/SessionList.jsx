import { ActionIcon, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import {
  IconCopy, IconListNumbers, IconPencil, IconPlayerPlayFilled, IconPlus, IconTrash,
} from '@tabler/icons-react';
import { DurationBadge } from './DurationBadge.jsx';
import { totalDuration } from '../core/model.js';
import { plural } from '../core/plural.js';
import { confirm } from '../app/feedback.jsx';

export function SessionList({ sessions, onNew, onEdit, onPlay, onDuplicate, onRemove }) {
  async function remove(s) {
    if (await confirm({ title: 'Supprimer la séance ?', message: s.name, confirmLabel: 'Supprimer', danger: true })) {
      onRemove(s.id);
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2} size="h3">Séances</Title>
        <Button leftSection={<IconPlus size={20} />} onClick={onNew}>Nouvelle séance</Button>
      </Group>

      {sessions.length === 0 && <Text c="dimmed">Aucune séance pour l’instant.</Text>}

      {sessions.map(s => (
        <Card key={s.id} withBorder radius="md" padding="md">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={6} style={{ minWidth: 0 }}>
              <Text fw={600} size="lg" truncate>{s.name.trim() || 'Sans nom'}</Text>
              <Group gap="xs">
                <DurationBadge seconds={totalDuration(s)} />
                <Text size="sm" c="dimmed">
                  <IconListNumbers size={14} style={{ verticalAlign: -2 }} /> {plural(s.steps.length, 'étape')}
                </Text>
              </Group>
            </Stack>
            <ActionIcon size={56} radius={999} onClick={() => onPlay(s)} aria-label="Lancer">
              <IconPlayerPlayFilled size={28} />
            </ActionIcon>
          </Group>
          <Group gap="xs" mt="sm">
            <ActionIcon variant="light" size="xl" onClick={() => onEdit(s)} aria-label="Modifier"><IconPencil /></ActionIcon>
            <ActionIcon variant="light" size="xl" onClick={() => onDuplicate(s.id)} aria-label="Dupliquer"><IconCopy /></ActionIcon>
            <ActionIcon variant="light" size="xl" color="red" onClick={() => remove(s)} aria-label="Supprimer"><IconTrash /></ActionIcon>
          </Group>
        </Card>
      ))}

    </Stack>
  );
}
