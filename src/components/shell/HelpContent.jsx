import { List } from '@mantine/core';

export function HelpContent() {
  return (
    <List size="sm" spacing="xs">
      <List.Item><b>YouTube</b> : colle l’URL d’une vidéo (youtube.com, music.youtube.com, youtu.be). Connecte-toi à YouTube dans ce navigateur pour profiter de Premium (sans pub).</List.Item>
      <List.Item><b>Playlist</b> : publique ou non répertoriée uniquement (les playlists privées, comme « J’aime », ne sont pas lisibles par le lecteur intégré).</List.Item>
      <List.Item>Certains clips interdisent la lecture intégrée : le lecteur l’indique et le temps continue.</List.Item>
      <List.Item><b>Fichier local</b> : copié dans le stockage du navigateur (hors ligne, écran éteint).</List.Item>
      <List.Item><b>Sauvegarde</b> : automatique à chaque modification.</List.Item>
      <List.Item>Avec YouTube, l’écran reste allumé pendant la séance (nécessite HTTPS).</List.Item>
    </List>
  );
}
