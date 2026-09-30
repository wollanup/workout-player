import { Group } from '@mantine/core';
import { PickerField } from './PickerField.jsx';
import { WheelPicker } from './WheelPicker.jsx';
import { formatSeconds } from '../core/time.js';


/** Short seconds setting (countdown, beeps, fade): one scroll wheel from 0 ("Non") to `max`. */
export function SecondsInput({ label, value, onChange, max, extra = null, ...props }) {
  const values = Array.from({ length: max + 1 }, (_, i) => i);
  const clamp = v => Math.min(max, Math.max(0, Math.round(+v || 0)));
  return (
    <PickerField label={label} value={clamp(value)} onChange={onChange} format={formatSeconds} normalize={clamp} {...props}>
      {(d, set) => (
        <>
          <Group justify="center">
            <WheelPicker label={label} values={values} value={d} format={formatSeconds} onChange={set} />
          </Group>
          {extra?.(d)}
        </>
      )}
    </PickerField>
  );
}
