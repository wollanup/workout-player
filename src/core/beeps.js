/** Seconds-before-end at which to beep: 1 s apart at first, then accelerating. */
export function beepTimes(countdown, { factor = 0.8, minGap = 0.12 } = {}) {
  const ts = [];
  let t = countdown, gap = 1;
  while (t > 0.15) {
    ts.push(t);
    t -= gap;
    gap = Math.max(minGap, gap * factor);
  }
  return ts;
}

/**
 * Beeps to schedule from now, given the remaining time of the step.
 * Pitch rises with the pace; a long high beep marks the transition.
 * @returns {{offset: number, freq: number, len: number, vol: number}[]}
 */
export function beepPlan(remaining, countdown) {
  const times = beepTimes(countdown);
  const plan = [];
  times.forEach((t, k) => {
    if (t > remaining + 0.02) return;
    plan.push({ offset: remaining - t, freq: 660 + (k / Math.max(1, times.length - 1)) * 330, len: 0.07, vol: 0.25 });
  });
  plan.push({ offset: Math.max(0, remaining), freq: 1320, len: 0.4, vol: 0.3 });
  return plan;
}
