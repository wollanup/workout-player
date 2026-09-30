import { useState } from 'react';
import { Button, Fieldset, SimpleGrid, Text, TextInput } from '@mantine/core';
import { IconPlaylistAdd } from '@tabler/icons-react';
import { TimeInput } from './TimeInput.jsx';
import { parseYouTube, fetchTitle } from '../core/youtube.js';
import { stepsFromPlaylist } from '../core/model.js';

/** Imports a public / unlisted YouTube or YT Music playlist as steps. */
export function PlaylistImport({ youtube, onAdd, onUpdate }) {
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(180);
  const [pause, setPause] = useState(20);
  const [status, setStatus] = useState({ loading: false, error: null, info: null });

  async function run() {
    const { list } = parseYouTube(url);
    if (!list) return setStatus({ error: 'URL de playlist invalide.' });
    setStatus({ loading: true, info: 'Chargement de la playlist…' });
    try {
      const ids = await youtube.playlistIds(list);
      const steps = stepsFromPlaylist(ids, duration, pause);
      onAdd(steps);
      setUrl('');
      setStatus({ loading: true, info: `${ids.length} morceau(x) ajouté(s), récupération des titres…` });
      const music = steps.filter(s => s.type === 'music');
      for (let k = 0; k < music.length; k += 6) {
        await Promise.all(music.slice(k, k + 6).map(async s => {
          const label = await fetchTitle(s.videoId);
          if (label) onUpdate(s.id, { label });
        }));
      }
      setStatus({ info: `${ids.length} morceau(x) ajouté(s).` });
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  return (
    <Fieldset legend="Importer une playlist YouTube / YT Music" radius="md">
      <TextInput label="URL de la playlist" placeholder="https://music.youtube.com/playlist?list=…"
        value={url} onChange={e => setUrl(e.currentTarget.value)} error={status.error} />
      <SimpleGrid cols={2} mt="xs">
        <TimeInput label="Durée par morceau" value={duration} onChange={setDuration} />
        <TimeInput label="Pause entre" description="0:00 = aucune" allowZero value={pause} onChange={setPause} />
      </SimpleGrid>
      <Button mt="sm" leftSection={<IconPlaylistAdd size={18} />} loading={status.loading} onClick={run} disabled={!url}>
        Importer
      </Button>
      {status.info && <Text size="sm" c="dimmed" mt="xs">{status.info}</Text>}
    </Fieldset>
  );
}
