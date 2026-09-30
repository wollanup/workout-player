import { useState } from 'react';
import { Button, Fieldset, Progress, Stack, Switch, Text, TextInput } from '@mantine/core';
import { IconPlaylistAdd } from '@tabler/icons-react';
import { DurationInput } from './DurationInput.jsx';
import { parseYouTube } from '../core/youtube.js';
import { stepsFromPlaylist } from '../core/model.js';
import { youTubeTrackInfo } from '../services/trackInfo.js';
import { plural } from '../core/plural.js';

/** Imports a public / unlisted YouTube or YT Music playlist as steps, then analyses each track. */
export function PlaylistImport({ youtube, onAdd, onUpdate }) {
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(180);
  const [wholeTrack, setWholeTrack] = useState(false);
  const [pause, setPause] = useState(20);
  const [status, setStatus] = useState({ loading: false, error: null, info: null, progress: null });

  async function run() {
    const { list } = parseYouTube(url);
    if (!list) return setStatus({ error: 'URL de playlist invalide.' });
    setStatus({ loading: true, info: 'Chargement de la playlist…' });
    try {
      const ids = await youtube.playlistIds(list);
      const steps = stepsFromPlaylist(ids, duration, pause);
      onAdd(steps);
      setUrl('');
      const music = steps.filter(s => s.type === 'music');
      for (const [k, s] of music.entries()) {
        setStatus({ loading: true, info: `Analyse des morceaux ${k + 1}/${music.length}…`, progress: (k / music.length) * 100 });
        const info = await youTubeTrackInfo(youtube, s.videoId);
        onUpdate(s.id, {
          trackDuration: info.trackDuration,
          ...(info.label && { label: info.label }),
          ...(wholeTrack && info.trackDuration > 0 && { duration: Math.floor(info.trackDuration) }),
        });
      }
      setStatus({ info: `${plural(music.length, 'morceau', 'morceaux')} ${music.length >= 2 ? 'ajoutés' : 'ajouté'}.` });
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  return (
    <Fieldset legend="Importer une playlist YouTube / YT Music" radius="md">
      <Stack gap="xs">
        <TextInput label="URL de la playlist" placeholder="https://music.youtube.com/playlist?list=…"
          value={url} onChange={e => setUrl(e.currentTarget.value)} error={status.error} />
        <Switch label="Morceaux entiers" description="Durée de chaque étape = durée du morceau"
          checked={wholeTrack} onChange={e => setWholeTrack(e.currentTarget.checked)} />
        {!wholeTrack && <DurationInput label="Durée par morceau" value={duration} onChange={setDuration} />}
        <DurationInput label="Pause entre" description="0 = aucune" min={0} value={pause} onChange={setPause} />
        <Button leftSection={<IconPlaylistAdd size={18} />} loading={status.loading} onClick={run} disabled={!url}>
          Importer
        </Button>
        {status.progress != null && <Progress value={status.progress} size="sm" />}
        {status.info && <Text size="sm" c="dimmed">{status.info}</Text>}
      </Stack>
    </Fieldset>
  );
}
