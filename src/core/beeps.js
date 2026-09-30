/**
 * Countdown rhythm, in beats before the end of the step: 2 quarter notes, 4 eighth notes,
 * then the transition lands on the next downbeat.
 */
export const BEEP_FREQ = 220;
export const BEEP_PATTERN = [
  { beats: 4, len: 0.35 }, // noire
  { beats: 3, len: 0.35 }, // noire
  { beats: 2, len: 0.1 }, // croche
  { beats: 1.5, len: 0.1 },
  { beats: 1, len: 0.1 },
  { beats: 0.5, len: 0.1 },
];
const PATTERN_BEATS = BEEP_PATTERN[0].beats;
const FINAL = { len: 0.5, vol: 0.3 };

/** One beat = 1 s, squeezed when the countdown is shorter than the pattern. */
export const beatLength = countdown => Math.min(1, countdown / PATTERN_BEATS);

/** Seconds-before-end of each countdown beep (final beep at 0 excluded). */
export function beepTimes(countdown) {
  const beat = beatLength(countdown);
  return BEEP_PATTERN.map(n => n.beats * beat);
}

/**
 * Beeps to schedule from now, given the remaining time of the step. Same pitch for all.
 * @returns {{offset: number, freq: number, len: number, vol: number}[]}
 */
export function beepPlan(remaining, countdown) {
  const beat = beatLength(countdown);
  const plan = [];
  for (const n of BEEP_PATTERN) {
    const t = n.beats * beat;
    if (t > remaining + 0.02) continue;
    plan.push({ offset: remaining - t, freq: BEEP_FREQ, len: Math.min(n.len, beat * 0.8), vol: 0.25 });
  }
  plan.push({ offset: Math.max(0, remaining), freq: BEEP_FREQ, ...FINAL });
  return plan;
}
