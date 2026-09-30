import { useState } from 'react';
import { ActionIcon, Alert, Avatar, Group, Loader, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { IconBrandApple, IconSearch } from '@tabler/icons-react';
import { AppleAccount } from './shell/AppleAccount.jsx';
import { appleSongUrl, parseAppleMusic } from '../core/appleMusic.js';
import { formatTime } from '../core/time.js';
import { useAppleAuth } from '../hooks/useAppleAuth.js';

/** Apple Music track of a step: paste a song link, or search the catalog and pick a result. */
export function AppleField({ step, apple, onTrack }) {
  const authorized = useAppleAuth(apple);
  const [editing, setEditing] = useState(null);
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: null });

  async function commit(text = editing) {
    if (text == null || !text.trim()) return;
    const p = parseAppleMusic(text);
    if (!p.songId && /^https?:/i.test(text.trim())) {
      return setStatus({ error: 'Lien de morceau Apple Music invalide' });
    }
    setStatus({ loading: true });
    try {
      if (p.songId) {
        const track = await apple.song(p.songId, p.storefront);
        if (!track) throw new Error('Morceau introuvable');
        pick(track);
      } else {
        const found = await apple.search(text.trim());
        setResults(found);
        setStatus({ error: found.length ? null : 'Aucun résultat' });
      }
    } catch (err) {
      setStatus({ error: err.message });
    }
  }

  function pick({ artwork, ...track }) {
    setEditing(null);
    setResults(null);
    setStatus({});
    onTrack(track);
  }

  return (
    <Stack gap="xs">
      <TextInput
        label="Morceau"
        placeholder="Lien Apple Music ou recherche"
        value={editing ?? (step.appleId ? appleSongUrl(step.appleId) : '')}
        error={status.error || (!step.appleId && editing == null ? 'Colle un lien ou cherche un morceau' : null)}
        onFocus={e => { setEditing(e.currentTarget.value); e.currentTarget.select(); }}
        onChange={e => setEditing(e.currentTarget.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); }}
        rightSection={status.loading ? <Loader size={16} /> : (
          <ActionIcon variant="subtle" color="pink" onClick={() => commit()} aria-label="Chercher sur Apple Music"
            disabled={!editing?.trim()}>
            <IconSearch size={18} />
          </ActionIcon>
        )}
      />
      {results?.length > 0 && (
        <Stack gap={4} role="listbox" aria-label="Résultats Apple Music">
          {results.map(t => (
            <UnstyledButton key={t.appleId} role="option" aria-selected={false} onClick={() => pick(t)}
              className="result-row" p={6}>
              <Group gap="sm" wrap="nowrap">
                <Avatar src={t.artwork} radius="sm" size={40} color="pink"><IconBrandApple size={20} /></Avatar>
                <Text size="sm" truncate style={{ flex: 1 }}>{t.label}</Text>
                {t.trackDuration > 0 && <Text size="sm" c="dimmed">{formatTime(t.trackDuration)}</Text>}
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      )}
      {!authorized && (
        <Alert color="pink" variant="light" p="xs">
          <Group justify="space-between" gap="xs">
            <Text size="sm" style={{ flex: '1 1 12rem' }}>Connecte ton compte Apple Music (abonnement requis) pour lire les morceaux en entier.</Text>
            <AppleAccount apple={apple} compact />
          </Group>
        </Alert>
      )}
    </Stack>
  );
}
