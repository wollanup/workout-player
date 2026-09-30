import { Anchor, Group, List, Stack, Text } from '@mantine/core';
import { IconBrandGithub, IconLicense, IconShieldLock } from '@tabler/icons-react';

/** @param {{apple?: boolean}} props apple: Apple Music is built in (developer token) */
export function HelpContent({ apple = false }) {
  return (
    <Stack gap="md">
      <List size="sm" spacing="xs">
        <List.Item><b>YouTube</b> : colle l’URL d’une vidéo (youtube.com, music.youtube.com, youtu.be). Les publicités dépendent de ton abonnement YouTube / YouTube Music : aucune avec Premium (connecte-toi à YouTube dans ce navigateur), sinon YouTube peut en insérer.</List.Item>
        {apple && <List.Item><b>Apple Music</b> : colle un lien ou cherche un morceau. Abonnement Apple Music requis : connecte ton compte dans Menu &gt; Sources.</List.Item>}
        <List.Item><b>Playlist</b> : {apple && 'choisis d’abord le fournisseur. '}YouTube : publique ou non répertoriée uniquement (les playlists privées, comme « J’aime », ne sont pas lisibles).{apple && ' Apple Music : lien de playlist ou d’album, ou tes playlists une fois connecté.'}</List.Item>
        <List.Item><b>Sources</b> : Menu &gt; Sources pour choisir celles proposées dans l’éditeur. Une séance peut les mélanger.</List.Item>
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
