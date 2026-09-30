import { useState } from 'react';
import { Button, Group, Input, Modal, Stack, Text } from '@mantine/core';
import { IconClockEdit } from '@tabler/icons-react';
import { WheelPicker } from './WheelPicker.jsx';
import { formatTime } from '../core/time.js';

const presetLabel = s => (s < 60 ? `${s} s` : s % 60 ? formatTime(s) : `${s / 60} min`);
const range = (from, to, step = 1) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
const clean = v => Math.max(0, Math.round(+v || 0));

/**
 * Compact duration field; tapping it opens a modal with presets + two scroll wheels
 * (minutes | seconds, 10 s steps). `extra(set)` renders additional quick picks in the modal.
 * @param {{value: number, onChange: (s: number) => void, min?: number, maxMinutes?: number,
 *   presets?: number[], extra?: (set: (s: number) => void, current: number) => import('react').ReactNode}} props
 */
export function DurationInput({ label, value, onChange, min = 5, maxMinutes = 10, presets = [], extra = null, ...props }) {
  const [draft, setDraft] = useState(null);
  const total = clean(value);
  const open = () => setDraft(total);
  const close = () => setDraft(null);
  const set = v => setDraft(Math.max(min, clean(v)));
  const commit = v => {
    const next = Math.max(min, clean(v));
    if (next !== total) onChange(next);
    close();
  };

  const d = draft ?? total;
  const m = Math.floor(d / 60);
  const s = d % 60;
  const minutes = range(0, Math.max(maxMinutes, m));
  // Off-grid seconds (e.g. "whole track" = 3:42) stay selectable.
  const seconds = s % 10 ? [...range(0, 50, 10), s].sort((a, b) => a - b) : range(0, 50, 10);
  const quick = extra?.(set, d);

  return (
    <>
      <Input.Wrapper label={label} {...props}>
        <Input
          component="button"
          type="button"
          pointer
          onClick={open}
          aria-label={`${label} : ${formatTime(total)}`}
          rightSection={<IconClockEdit size={18} />}
          styles={{ input: { fontVariantNumeric: 'tabular-nums', fontWeight: 600 } }}
        >
          {formatTime(total)}
        </Input>
      </Input.Wrapper>

      <Modal opened={draft !== null} onClose={close} title={label} centered size="sm">
        <Stack gap="md">
          <Text ta="center" fz={32} fw={700} ff="monospace" data-testid={`${label}-value`}>{formatTime(d)}</Text>
          {(presets.length > 0 || quick) && (
            <Group gap={4} wrap="nowrap" grow preventGrowOverflow={false}>
              {presets.map(p => (
                <Button key={p} size="compact-md" px={4} variant={p === d ? 'filled' : 'default'} onClick={() => set(p)}>
                  {presetLabel(p)}
                </Button>
              ))}
              {quick}
            </Group>
          )}
          <Group justify="center" gap="xs" wrap="nowrap">
            <WheelPicker label={`${label} (minutes)`} values={minutes} value={m} format={String}
              onChange={v => set(v * 60 + s)} />
            <Text c="dimmed" w={32}>min</Text>
            <WheelPicker label={`${label} (secondes)`} values={seconds} value={s}
              onChange={v => set(m * 60 + v)} />
            <Text c="dimmed" w={32}>s</Text>
          </Group>
          <Group grow>
            <Button variant="default" onClick={close}>Annuler</Button>
            <Button onClick={() => commit(d)}>Valider</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
