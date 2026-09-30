import { Button, Group, Text } from '@mantine/core';
import { PickerField } from './PickerField.jsx';
import { WheelPicker } from './WheelPicker.jsx';
import { formatTime } from '../core/time.js';

const presetLabel = s => (s < 60 ? `${s} s` : s % 60 ? formatTime(s) : `${s / 60} min`);
const range = (from, to, step = 1) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
const clean = v => Math.max(0, Math.round(+v || 0));

/**
 * Duration field (m:ss); the modal has presets + two scroll wheels (minutes | seconds, 10 s steps).
 * `extra(set, current)` renders additional quick picks.
 */
export function DurationInput({ label, value, onChange, min = 5, maxMinutes = 10, presets = [], extra = null, ...props }) {
  return (
    <PickerField label={label} value={clean(value)} onChange={onChange} format={formatTime}
      normalize={v => Math.max(min, clean(v))} {...props}>
      {(d, set) => {
        const m = Math.floor(d / 60);
        const s = d % 60;
        // Off-grid seconds (e.g. "whole track" = 3:42) stay selectable.
        const seconds = s % 10 ? [...range(0, 50, 10), s].sort((a, b) => a - b) : range(0, 50, 10);
        const quick = extra?.(set, d);
        return (
          <>
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
              <WheelPicker label={`${label} (minutes)`} values={range(0, Math.max(maxMinutes, m))} value={m}
                format={String} onChange={v => set(v * 60 + s)} />
              <Text c="dimmed" w={32}>min</Text>
              <WheelPicker label={`${label} (secondes)`} values={seconds} value={s} onChange={v => set(m * 60 + v)} />
              <Text c="dimmed" w={32}>s</Text>
            </Group>
          </>
        );
      }}
    </PickerField>
  );
}
