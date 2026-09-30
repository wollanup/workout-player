import { useState } from 'react';
import { Button, Group, Input, Modal, Stack, Text } from '@mantine/core';
import { IconClockEdit } from '@tabler/icons-react';

/**
 * Compact read-only field; tapping it opens a modal to edit a draft, applied on "Valider".
 * `children(draft, setDraft)` renders the picker.
 */
export function PickerField({ label, value, onChange, format, normalize = v => v, children, ...props }) {
  const [draft, setDraft] = useState(null);
  const close = () => setDraft(null);
  const set = v => setDraft(normalize(v));
  const commit = () => {
    const next = normalize(draft);
    if (next !== value) onChange(next);
    close();
  };

  return (
    <>
      <Input.Wrapper label={label} {...props}>
        <Input
          component="button"
          type="button"
          pointer
          onClick={() => setDraft(value)}
          aria-label={`${label} : ${format(value)}`}
          rightSection={<IconClockEdit size={18} />}
          styles={{ input: { fontVariantNumeric: 'tabular-nums', fontWeight: 600 } }}
        >
          {format(value)}
        </Input>
      </Input.Wrapper>

      <Modal opened={draft !== null} onClose={close} title={label} centered size="sm">
        {draft !== null && (
          <Stack gap="md">
            <Text ta="center" fz={32} fw={700} ff="monospace" data-testid={`${label}-value`}>{format(draft)}</Text>
            {children(draft, set)}
            <Group grow>
              <Button variant="default" onClick={close}>Annuler</Button>
              <Button onClick={commit}>Valider</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
