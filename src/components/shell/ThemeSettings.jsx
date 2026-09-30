import { CheckIcon, ColorSwatch, Input, SegmentedControl, SimpleGrid, Stack, useMantineColorScheme } from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import { useAccent } from '../../hooks/useAccent.js';
import { ACCENTS } from '../../app/theme.js';

const SCHEMES = [
  { value: 'light', label: 'Clair', Icon: IconSun },
  { value: 'dark', label: 'Sombre', Icon: IconMoon },
  { value: 'auto', label: 'Système', Icon: IconDeviceDesktop },
];

export function ThemeSettings() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [accent, setAccent] = useAccent();

  return (
    <Stack gap="lg">
      <Input.Wrapper label="Apparence">
        <SegmentedControl
          fullWidth mt={4}
          value={colorScheme}
          onChange={setColorScheme}
          data={SCHEMES.map(({ value, label, Icon }) => ({
            value,
            label: <Stack gap={2} align="center" py={4}><Icon size={20} /><span>{label}</span></Stack>,
          }))}
        />
      </Input.Wrapper>
      <Input.Wrapper label="Couleur d’accent">
        <SimpleGrid cols={6} spacing="sm" mt={6}>
          {ACCENTS.map(c => (
            <ColorSwatch
              key={c}
              component="button"
              type="button"
              color={`var(--mantine-color-${c}-filled)`}
              size={40}
              radius="xl"
              onClick={() => setAccent(c)}
              aria-label={c}
              aria-pressed={c === accent}
              style={{ color: '#fff', cursor: 'pointer', justifySelf: 'center' }}
            >
              {c === accent && <CheckIcon style={{ width: 16, height: 16 }} />}
            </ColorSwatch>
          ))}
        </SimpleGrid>
      </Input.Wrapper>
    </Stack>
  );
}
