import { useState } from 'react';
import { TextInput } from '@mantine/core';
import { formatTime, parseTime } from '../core/time.js';

/**
 * "m:ss" text input bound to a number of seconds. Free typing while focused,
 * parsed on blur (invalid input reverts to the previous value).
 */
export function TimeInput({ value, onChange, allowZero = false, ...props }) {
  const [editing, setEditing] = useState(null);

  function commit() {
    const v = parseTime(editing);
    if (Number.isFinite(v) && (allowZero || v > 0) && v !== value) onChange(v);
    setEditing(null);
  }

  return (
    <TextInput
      inputMode="numeric"
      {...props}
      value={editing ?? formatTime(value)}
      onFocus={e => { setEditing(formatTime(value)); e.currentTarget.select(); }}
      onChange={e => setEditing(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    />
  );
}
