import { useEffect, useState } from 'react';
import {
  Button, Fieldset, Group, Progress, Select, SimpleGrid, Stack, Switch, Text, TextInput,
} from '@mantine/core';
import { IconArrowsExchange, IconPlaylistAdd } from '@tabler/icons-react';
import { DurationInput } from './DurationInput.jsx';
import { AppleAccount } from './shell/AppleAccount.jsx';
import { MUSIC_PRESETS } from '../core/time.js';
import { parseYouTube } from '../core/youtube.js';
import { parseAppleMusic } from '../core/appleMusic.js';
import { stepsFromTracks } from '../core/model.js';
import { sourceMeta } from '../core/sources.js';
import { SOURCE_ICONS } from '../app/sourceIcons.js';
import { youTubeTrackInfo } from '../services/trackInfo.js';
import { plural } from '../core/plural.js';
import { useAppleAuth } from '../hooks/useAppleAuth.js';

const added = n => `${plural(n, 'morceau', 'morceaux')} ${n >= 2 ? 'ajoutés' : 'ajouté'}.`;

/** Public / unlisted YouTube or YT Music playlist. Tracks are analysed one by one after import. */
function YouTubePlaylist({ youtube, options, onAdd, onUpdate, setStatus, status }) {
  const [url, setUrl] = useState('');

  async function run() {
    const { list } = parseYouTube(url);
    if (!list) return setStatus({ error: 'URL de playlist invalide.' });
    setStatus({ loading: true, info: 'Chargement de la playlist…' });
    try {
      const ids = await youtube.playlistIds(list);
      const steps = stepsFromTracks('yt', ids.map(videoId => ({ videoId })), options);
      onAdd(steps);
      setUrl('');
      const music = steps.filter(s => s.type === 'music');
      for (const [k, s] of music.entries()) {
        setStatus({ loading: true, info: `Analyse des morceaux ${k + 1}/${music.length}…`, progress: (k / music.length) * 100 });
        const info = await youTubeTrackInfo(youtube, s.videoId);
        onUpdate(s.id, {
          trackDuration: info.trackDuration,
          ...(info.label && { label: info.label }),
          ...(options.wholeTrack && info.trackDuration > 0 && { duration: Math.floor(info.trackDuration) }),
        });
      }
      setStatus({ info: added(music.length) });
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  return (
    <>
      <TextInput label="URL de la playlist" placeholder="https://music.youtube.com/playlist?list=…"
        value={url} onChange={e => setUrl(e.currentTarget.value)} error={status.error} />
      <ImportButton status={status} onClick={run} disabled={!url} />
    </>
  );
}

/** Apple Music playlist or album link, or one of the user's playlists once signed in. */
function ApplePlaylist({ apple, options, onAdd, setStatus, status }) {
  const authorized = useAppleAuth(apple);
  const [url, setUrl] = useState('');
  const [mine, setMine] = useState(null);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (!authorized) return;
    let live = true;
    apple.libraryPlaylists().then(l => live && setMine(l), () => live && setMine([]));
    return () => { live = false; };
  }, [apple, authorized]);

  async function run() {
    const ref = picked ? { playlistId: picked, library: true } : parseAppleMusic(url);
    if (!ref.playlistId && !ref.albumId) return setStatus({ error: 'Lien de playlist ou d’album Apple Music invalide.' });
    setStatus({ loading: true, info: 'Chargement de la playlist…' });
    try {
      const tracks = (await apple.tracks(ref)).filter(t => t.appleId);
      if (!tracks.length) throw new Error('Aucun morceau lisible dans cette playlist.');
      onAdd(stepsFromTracks('apple', tracks, options));
      setUrl('');
      setPicked(null);
      setStatus({ info: added(tracks.length) });
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  return (
    <>
      {authorized ? (
        <Select label="Mes playlists" placeholder={mine ? 'Choisir une playlist' : 'Chargement…'} clearable searchable
          data={(mine ?? []).map(p => ({ value: p.id, label: p.name }))} value={picked}
          onChange={v => { setPicked(v); if (v) setUrl(''); }} nothingFoundMessage="Aucune playlist" />
      ) : (
        <Group justify="space-between" gap="xs">
          <Text size="sm" c="dimmed" style={{ flex: '1 1 12rem' }}>Connecte-toi pour importer tes playlists (abonnement requis pour la lecture).</Text>
          <AppleAccount apple={apple} compact />
        </Group>
      )}
      <TextInput label={authorized ? 'Ou lien de playlist / album' : 'Lien de playlist ou d’album'}
        placeholder="https://music.apple.com/fr/playlist/…"
        value={url} onChange={e => { setUrl(e.currentTarget.value); setPicked(null); }} error={status.error} />
      <ImportButton status={status} onClick={run} disabled={!url && !picked} />
    </>
  );
}

function ImportButton({ status, ...props }) {
  return (
    <Button leftSection={<IconPlaylistAdd size={18} />} loading={status.loading} {...props}>Importer</Button>
  );
}

/**
 * Imports a playlist as steps. First pick the provider (skipped when only one is enabled), then its own form.
 * @param {{providers: string[]}} props sources that support playlists and are enabled
 */
export function PlaylistImport({ providers, youtube, apple, onAdd, onUpdate }) {
  const [chosen, setChosen] = useState(null);
  const [duration, setDuration] = useState(180);
  const [wholeTrack, setWholeTrack] = useState(false);
  const [pause, setPause] = useState(20);
  const [status, setStatus] = useState({ loading: false, error: null, info: null, progress: null });

  if (!providers.length) return null;
  const provider = providers.length === 1 ? providers[0] : (providers.includes(chosen) ? chosen : null);
  const choose = id => { setChosen(id); setStatus({}); };
  const options = { duration, pause, wholeTrack };
  const Form = { yt: YouTubePlaylist, apple: ApplePlaylist }[provider];

  return (
    <Fieldset legend="Importer une playlist" radius="md">
      {!provider ? (
        <Stack gap="xs">
          <Text size="sm" c="dimmed">Depuis quel service ?</Text>
          <SimpleGrid cols={providers.length} spacing="xs">
            {providers.map(id => {
              const { color, label } = sourceMeta(id);
              const Icon = SOURCE_ICONS[id];
              return (
                <Button key={id} variant="light" color={color} h={72} px="xs" onClick={() => choose(id)}>
                  <Stack gap={4} align="center"><Icon size={26} /><span>{label}</span></Stack>
                </Button>
              );
            })}
          </SimpleGrid>
        </Stack>
      ) : (
        <Stack gap="xs">
          <Group justify="space-between" wrap="nowrap">
            <Group gap={6} wrap="nowrap">
              {(() => { const Icon = SOURCE_ICONS[provider]; return <Icon size={20} color={`var(--mantine-color-${sourceMeta(provider).color}-6)`} />; })()}
              <Text fw={600}>{provider === 'yt' ? 'YouTube / YT Music' : sourceMeta(provider).label}</Text>
            </Group>
            {providers.length > 1 && (
              <Button variant="subtle" size="compact-sm" leftSection={<IconArrowsExchange size={16} />}
                onClick={() => choose(null)} disabled={status.loading}>Changer</Button>
            )}
          </Group>
          <Switch label="Morceaux entiers" description="Durée de chaque étape = durée du morceau"
            checked={wholeTrack} onChange={e => setWholeTrack(e.currentTarget.checked)} />
          <SimpleGrid cols={2} spacing="xs">
            {wholeTrack ? <div /> : (
              <DurationInput label="Durée par morceau" value={duration} onChange={setDuration} presets={MUSIC_PRESETS} />
            )}
            <DurationInput label="Pause entre" min={0} maxMinutes={5} value={pause} onChange={setPause}
              presets={[0, 10, 20, 30]} />
          </SimpleGrid>
          <Form youtube={youtube} apple={apple} options={options} onAdd={onAdd} onUpdate={onUpdate}
            status={status} setStatus={setStatus} />
          {status.progress != null && <Progress value={status.progress} size="sm" />}
          {status.info && <Text size="sm" c="dimmed">{status.info}</Text>}
        </Stack>
      )}
    </Fieldset>
  );
}
