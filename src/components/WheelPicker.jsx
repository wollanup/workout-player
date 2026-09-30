import { useEffect, useRef } from 'react';

// Item height comes from CSS (--wheel-item, larger on mobile).
const itemHeight = el => el?.querySelector('.wheel-item')?.offsetHeight || 36;
const pad = n => String(n).padStart(2, '0');

/**
 * Vertical scroll wheel: values slide under a center band, the centered one is selected.
 * Native scroll + CSS snap for touch inertia; arrows / click for keyboard and mouse.
 */
export function WheelPicker({ values, value, onChange, label, format = pad }) {
  const ref = useRef(null);
  const timer = useRef(0);
  const idx = Math.max(0, values.indexOf(value));

  // Follow external changes (presets, clamping) without fighting an ongoing user scroll.
  useEffect(() => {
    const el = ref.current;
    if (el && Math.round(el.scrollTop / itemHeight(el)) !== idx) el.scrollTop = idx * itemHeight(el);
  }, [idx]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = i => {
    const v = values[Math.min(values.length - 1, Math.max(0, i))];
    if (v !== value) onChange(v);
  };

  function onScroll() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => pick(Math.round(ref.current.scrollTop / itemHeight(ref.current))), 120);
  }

  function onKeyDown(e) {
    const step = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 }[e.key];
    if (!step) return;
    e.preventDefault();
    pick(idx + step);
  }

  return (
    <div className="wheel-box">
      <div
        ref={ref}
        className="wheel"
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={values[0]}
        aria-valuemax={values.at(-1)}
        aria-valuetext={format(value)}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
      >
        <div className="wheel-pad" />
        {values.map((v, i) => (
          <div key={v} className="wheel-item" data-selected={i === idx || undefined} onClick={() => pick(i)}>
            {format(v)}
          </div>
        ))}
        <div className="wheel-pad" />
      </div>
    </div>
  );
}
