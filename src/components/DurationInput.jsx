import { useState } from 'react';
import { ActionIcon, Group, Input, NumberInput, Text } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';

/** Numeric field committed on blur, so typing "75" in seconds can carry over into minutes. */
function Part({ value, onCommit, suffix, label }) {
  const [text, setText] = useState(null);
  return (
    <NumberInput
      aria-label={label}
      hideControls
      allowDecimal={false}
      allowNegative={false}
      clampBehavior="none"
      inputMode="numeric"
      w={78}
      value={text ?? value}
      onChange={setText}
      onFocus={e => e.currentTarget.select()}
      onBlur={() => { if (text !== null && text !== '') onCommit(+text); setText(null); }}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      rightSection={<Text size="sm" c="dimmed">{suffix}</Text>}
      rightSectionPointerEvents="none"
      rightSectionWidth={34}
      styles={{ input: { textAlign: 'right', paddingRight: 38 } }}
    />
  );
}

/**
 * Duration as minutes + seconds fields with -/+ steppers: no "m:ss" typing on a phone keyboard.
 * @param {{value: number, onChange: (s: number) => void, min?: number, step?: number}} props
 */
export function DurationInput({ label, value, onChange, min = 5, step = 5, rightSection = null, ...props }) {
  const total = Math.max(0, Math.round(+value || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const set = v => {
    const next = Math.max(min, Math.round(v));
    if (next !== total) onChange(next);
  };
  // Snap to the step grid so +/- lands on round values (2:35 -> 2:40, not 2:40 -> 2:45 from 2:37).
  const stepBy = dir => set(dir > 0 ? Math.floor(total / step) * step + step : Math.ceil(total / step) * step - step);

  return (
    <Input.Wrapper label={label} {...props}>
      <Group gap={6} wrap="nowrap">
        <ActionIcon variant="default" size={36} onClick={() => stepBy(-1)} disabled={total <= min}
          aria-label={`${label} : moins ${step} s`}>
          <IconMinus size={18} />
        </ActionIcon>
        <Part label={`${label} (minutes)`} value={m} suffix="min" onCommit={v => set(v * 60 + s)} />
        <Part label={`${label} (secondes)`} value={s} suffix="s" onCommit={v => set(m * 60 + v)} />
        <ActionIcon variant="default" size={36} onClick={() => stepBy(1)} aria-label={`${label} : plus ${step} s`}>
          <IconPlus size={18} />
        </ActionIcon>
        {rightSection}
      </Group>
    </Input.Wrapper>
  );
}
