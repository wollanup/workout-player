import { Accordion, ActionIcon, Button, Card, Group, List, Stack, Text, Title } from '@mantine/core';
import {
  IconBarbell, IconCopy, IconHelpCircle, IconListNumbers, IconPencil, IconPlayerPlayFilled, IconPlus, IconTrash,
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
        <Group gap="xs">
          <IconBarbell size={32} color="var(--mantine-color-green-5)" />
          <Title order={1} size="h2">Workout Player</Title>
        </Group>
        <Button leftSection={<IconPlus size={20} />} onClick={onNew}>Nouvelle séance</Button>
      </Group>

      {sessions.length === 0 && <Text c="dimmed">Aucune séance pour l’instant.</Text>}

      {sessions.map(s => (
        <Card key={s.id} withBorder radius="md" padding="md">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={6} style={{ minWidth: 0 }}>
              <Text fw={600} size="lg" truncate>{s.name}</Text>
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

      <Accordion variant="contained" radius="md">
        <Accordion.Item value="help">
          <Accordion.Control icon={<IconHelpCircle size={20} />}>Aide</Accordion.Control>
          <Accordion.Panel>
            <List size="sm" spacing="xs">
              <List.Item><b>YouTube</b> : colle l’URL d’une vidéo (youtube.com, music.youtube.com, youtu.be). Connecte-toi à YouTube dans ce navigateur pour profiter de Premium (sans pub).</List.Item>
              <List.Item><b>Playlist</b> : publique ou non répertoriée uniquement (les playlists privées, comme « J’aime », ne sont pas lisibles par le lecteur intégré).</List.Item>
              <List.Item>Certains clips interdisent la lecture intégrée : le lecteur l’indique et le temps continue.</List.Item>
              <List.Item><b>Fichier local</b> : copié dans le stockage du navigateur (hors ligne, écran éteint).</List.Item>
              <List.Item>Avec YouTube, l’écran reste allumé pendant la séance (nécessite HTTPS).</List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
