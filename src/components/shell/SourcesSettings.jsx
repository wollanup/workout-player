import { Divider, Stack, Switch, Text } from '@mantine/core';
import { SOURCES } from '../../core/sources.js';
import { SOURCE_ICONS } from '../../app/sourceIcons.js';
import { useSources } from '../../hooks/useSources.js';
import { AppleAccount } from './AppleAccount.jsx';

const DESCRIPTIONS = {
  yt: 'Vidéos et playlists YouTube / YouTube Music. Les publicités dépendent de ton abonnement : aucune avec YouTube Premium (connecte-toi à YouTube dans ce navigateur), sinon YouTube peut en insérer.',
  apple: 'Morceaux, albums et playlists Apple Music. Abonnement Apple Music requis pour la lecture complète.',
  local: 'Fichiers audio du téléphone, copiés dans le navigateur : fonctionne hors ligne.',
};

/** Which music sources the editor offers. At least one stays on; sources not built in are hidden. */
export function SourcesSettings({ apple }) {
  const { available, active, setEnabled } = useSources(apple);

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">Les sources activées apparaissent dans l’éditeur. Une séance peut les mélanger.</Text>
      {SOURCES.filter(({ id }) => available[id] !== false).map(({ id, label, color }, k) => {
        const Icon = SOURCE_ICONS[id];
        const on = active.includes(id);
        return (
          <Stack key={id} gap="xs">
            {k > 0 && <Divider />}
            <Switch
              size="md"
              aria-label={label}
              color={color}
              checked={on}
              disabled={on && active.length === 1}
              onChange={e => setEnabled(id, e.currentTarget.checked)}
              label={<Text span fw={600} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon size={20} color={`var(--mantine-color-${color}-6)`} />{label}
              </Text>}
              description={DESCRIPTIONS[id]}
            />
            {id === 'apple' && on && <AppleAccount apple={apple} />}
          </Stack>
        );
      })}
    </Stack>
  );
}
