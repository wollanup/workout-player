import { Anchor, Group, List, Stack, Text } from '@mantine/core';
import { IconBrandGithub, IconLicense, IconShieldLock } from '@tabler/icons-react';

export function HelpContent() {
  return (
    <Stack gap="md">
      <List size="sm" spacing="xs">
        <List.Item><b>YouTube</b> : colle l’URL d’une vidéo (youtube.com, music.youtube.com, youtu.be). Connecte-toi à YouTube dans ce navigateur pour profiter de Premium (sans pub).</List.Item>
        <List.Item><b>Playlist</b> : publique ou non répertoriée uniquement (les playlists privées, comme « J’aime », ne sont pas lisibles par le lecteur intégré).</List.Item>
        <List.Item>Certains clips interdisent la lecture intégrée : le lecteur l’indique et le temps continue.</List.Item>
        <List.Item><b>Fichier local</b> : copié dans le stockage du navigateur (hors ligne, écran éteint).</List.Item>
        <List.Item><b>Sauvegarde</b> : automatique à chaque modification.</List.Item>
        <List.Item>Avec YouTube, l’écran reste allumé pendant la séance (nécessite HTTPS).</List.Item>
      </List>
      <Group gap="xs" columnGap="lg">
        <Anchor href="https://github.com/wollanup/workout-player" target="_blank" rel="noopener" size="sm">
          <Group gap={4} wrap="nowrap"><IconBrandGithub size={16} /><Text span inherit>Code source</Text></Group>
        </Anchor>
        <Anchor href={`${import.meta.env.BASE_URL}licenses.txt`} target="_blank" size="sm">
          <Group gap={4} wrap="nowrap"><IconLicense size={16} /><Text span inherit>Licences open source</Text></Group>
        </Anchor>
        <Anchor href="https://github.com/wollanup/workout-player/blob/main/docs/LEGAL.md" target="_blank" rel="noopener" size="sm">
          <Group gap={4} wrap="nowrap"><IconShieldLock size={16} /><Text span inherit>Mentions légales et vie privée</Text></Group>
        </Anchor>
      </Group>
    </Stack>
  );
}
