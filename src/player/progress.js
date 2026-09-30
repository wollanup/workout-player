/** Session progress figures derived from the engine state. */
export function sessionProgress(st) {
  const total = st.steps.reduce((a, s) => a + (+s.duration || 0), 0);
  if (st.status === 'done') return { total, elapsed: total, left: 0 };
  const before = st.steps.slice(0, Math.max(0, st.idx)).reduce((a, s) => a + (+s.duration || 0), 0);
  const elapsed = before + (st.duration - st.remaining);
  return { total, elapsed, left: total - elapsed };
}
