import { useState } from 'react';
import { ActionIcon, Group, Menu, Modal, Title, UnstyledButton } from '@mantine/core';
import { IconBarbell, IconDotsVertical, IconHelpCircle, IconPalette, IconPlug } from '@tabler/icons-react';
import { ThemeSettings } from './ThemeSettings.jsx';
import { HelpContent } from './HelpContent.jsx';
import { SourcesSettings } from './SourcesSettings.jsx';

export const APP_NAME = 'Workout Player';

export function AppHeader({ onHome, apple }) {
  const [dialog, setDialog] = useState(null);
  const close = () => setDialog(null);

  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <UnstyledButton onClick={onHome} aria-label="Accueil">
        <Group gap="xs" wrap="nowrap">
          <IconBarbell size={28} color="var(--mantine-primary-color-filled)" />
          <Title order={1} size="h3" className="nowrap">{APP_NAME}</Title>
        </Group>
      </UnstyledButton>

      <Menu position="bottom-end" width={200} shadow="md">
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray" size="xl" aria-label="Menu">
            <IconDotsVertical />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconPlug size={18} />} onClick={() => setDialog('sources')}>Sources</Menu.Item>
          <Menu.Item leftSection={<IconPalette size={18} />} onClick={() => setDialog('theme')}>Thème</Menu.Item>
          <Menu.Item leftSection={<IconHelpCircle size={18} />} onClick={() => setDialog('help')}>Aide</Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal opened={dialog === 'sources'} onClose={close} title="Sources musicales" centered>
        <SourcesSettings apple={apple} />
      </Modal>
      <Modal opened={dialog === 'theme'} onClose={close} title="Thème" centered>
        <ThemeSettings />
      </Modal>
      <Modal opened={dialog === 'help'} onClose={close} title="Aide" centered size="lg">
        <HelpContent />
      </Modal>
    </Group>
  );
}
