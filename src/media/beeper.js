/** Web Audio beeper: schedules a beep plan (see core/beeps.js) with sample accuracy. */
export function createBeeper() {
  let ctx = null;
  let nodes = [];

  const context = () => {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  function beep(c, at, { freq, len, vol }) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.005);
    g.gain.setValueAtTime(vol, at + len - 0.02);
    g.gain.linearRampToValueAtTime(0, at + len);
    o.connect(g).connect(c.destination);
    o.start(at);
    o.stop(at + len + 0.01);
    return o;
  }

  return {
    /** Must be called from a user gesture at least once (autoplay policy). */
    unlock: () => { context(); },
    schedule(plan) {
      const c = context();
      const now = c.currentTime;
      nodes = plan.map(b => beep(c, now + b.offset, b));
    },
    cancel() {
      for (const o of nodes) { try { o.stop(); } catch { /* already stopped */ } }
      nodes = [];
    },
  };
}
