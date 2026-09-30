import { useState } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { IconLogin, IconLogout } from '@tabler/icons-react';
import { useAppleAuth } from '../../hooks/useAppleAuth.js';
import { notifyError } from '../../app/feedback.jsx';

/** Sign-in state of Apple Music with a connect / disconnect button. */
export function AppleAccount({ apple, compact = false }) {
  const authorized = useAppleAuth(apple);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await (authorized ? apple.unauthorize() : apple.authorize());
    } catch (err) {
      notifyError(err?.message || String(err), 'Apple Music');
    } finally {
      setBusy(false);
    }
  }

  const button = (
    <Button size={compact ? 'xs' : 'sm'} variant={authorized ? 'default' : 'filled'} color="pink" loading={busy} onClick={toggle} style={{ flexShrink: 0 }}
      leftSection={authorized ? <IconLogout size={16} /> : <IconLogin size={16} />}>
      {authorized ? 'Déconnecter' : 'Se connecter'}
    </Button>
  );
  if (compact) return button;
  return (
    <Group justify="space-between" wrap="nowrap" gap="xs" pl={52}>
      <Text size="sm" c={authorized ? 'teal' : 'dimmed'} className="nowrap">{authorized ? 'Connecté' : 'Non connecté'}</Text>
      {button}
    </Group>
  );
}
