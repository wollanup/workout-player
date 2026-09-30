import { buildRunSteps } from '../core/model.js';
import { beepPlan } from '../core/beeps.js';
import { clamp01 } from '../core/time.js';

/**
 * Media adapter contract (see src/media/*):
 *   load(step, { onPlaying, onError }), pause(), resume(), stop(), setVolume(0..1), stallHint?
 * Beeper contract: unlock(), schedule(plan), cancel()
 * WakeLock contract: acquire(), release()
 *
 * The engine is UI-agnostic: subscribe() receives an immutable state snapshot on every change,
 * so it can be bound to vanilla DOM today or to a React hook (useSyncExternalStore) later.
 */
export const IDLE = Object.freeze({
  status: 'idle', session: null, steps: [], hasLead: false, idx: -1,
  remaining: 0, duration: 0, ready: false, error: '',
});

export class WorkoutEngine {
  #media; #beeper; #wakeLock; #now; #autoTick; #tickMs; #stallHintMs; #readyTimeoutMs;
  #listeners = new Set();
  #timer = null;
  #timeouts = [];
  #lastTs = 0;
  #token = 0;
  #beepsScheduled = false;
  #volume = 1;

  constructor({
    media, beeper = null, wakeLock = null, now = () => performance.now(),
    autoTick = true, tickMs = 100, stallHintMs = 4000, readyTimeoutMs = 10000,
  }) {
    this.#media = media;
    this.#beeper = beeper;
    this.#wakeLock = wakeLock;
    this.#now = now;
    this.#autoTick = autoTick;
    this.#tickMs = tickMs;
    this.#stallHintMs = stallHintMs;
    this.#readyTimeoutMs = readyTimeoutMs;
    this.state = IDLE;
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  getState = () => this.state;

  get current() { return this.state.steps[this.state.idx]; }

  #set(patch) {
    this.state = { ...this.state, ...patch };
    for (const fn of this.#listeners) fn(this.state);
  }

  start(session) {
    this.#teardown();
    const steps = buildRunSteps(session);
    if (!steps.length) return;
    // No emit here: subscribers get the first consistent state (idx 0) from #goTo.
    this.state = { ...IDLE, status: 'running', session, steps, hasLead: steps[0]?.lead === true };
    this.#lastTs = this.#now();
    this.#beeper?.unlock();
    this.#wakeLock?.acquire();
    if (steps.some(s => s.source === 'yt')) this.#media.yt?.preload?.();
    if (this.#autoTick) this.#timer = setInterval(() => this.tick(), this.#tickMs);
    this.#goTo(0);
  }

  stop() {
    this.#teardown();
    this.#set(IDLE);
  }

  togglePause() {
    const { status, session } = this.state;
    if (status === 'done') return this.start(session);
    if (status === 'running') {
      this.#cancelBeeps();
      this.#adapter()?.pause();
      this.#set({ status: 'paused' });
    } else if (status === 'paused') {
      this.#beeper?.unlock();
      this.#lastTs = this.#now();
      this.#adapter()?.resume();
      this.#set({ status: 'running' });
    }
  }

  next() {
    if (this.#active()) this.#goTo(this.state.idx + 1);
  }

  /** Like a regular player: restart the current step unless we're at its very beginning. */
  prev() {
    if (!this.#active()) return;
    const { idx, duration, remaining } = this.state;
    this.#goTo(duration - remaining > 3 ? idx : idx - 1);
  }

  tick() {
    const t = this.#now();
    const dt = (t - this.#lastTs) / 1000;
    this.#lastTs = t;
    const s = this.state;
    if (s.status !== 'running' || !s.ready) return;
    const step = this.current;
    const remaining = s.remaining - dt;
    const cd = +s.session.countdown || 0;
    if (cd > 0 && !this.#beepsScheduled && remaining <= cd) {
      this.#beeper?.schedule(beepPlan(Math.max(0, remaining), cd));
      this.#beepsScheduled = true;
    }
    if (step.type === 'music' && step.fade > 0) this.#applyVolume(clamp01(remaining / step.fade));
    if (remaining <= 0) return this.#goTo(s.idx + 1);
    this.#set({ remaining });
  }

  #active() { return this.state.status === 'running' || this.state.status === 'paused'; }

  #adapter(step = this.current) {
    return step?.type === 'music' ? this.#media[step.source] : null;
  }

  #goTo(i) {
    this.#cancelBeeps();
    this.#clearTimeouts();
    const { steps } = this.state;
    if (i >= steps.length) return this.#finish();
    const idx = Math.max(0, i);
    const step = steps[idx];
    const token = ++this.#token;
    const guard = fn => (...args) => { if (token === this.#token) fn(...args); };
    const adapter = this.#adapter(step);
    this.#volume = 1;
    for (const a of Object.values(this.#media)) if (a !== adapter) a.stop();
    this.#set({
      status: 'running', idx, duration: +step.duration, remaining: +step.duration,
      ready: !adapter, error: '',
    });
    if (!adapter) return;

    // If media doesn't start (autoplay blocked, network…), let the timer run anyway.
    if (adapter.stallHint) {
      this.#timeouts.push(setTimeout(guard(() => {
        if (!this.state.ready) this.#set({ error: adapter.stallHint });
      }), this.#stallHintMs));
    }
    this.#timeouts.push(setTimeout(guard(() => {
      if (!this.state.ready) this.#set({ ready: true, error: 'La musique ne démarre pas, le temps continue.' });
    }), this.#readyTimeoutMs));

    adapter.load(step, {
      onPlaying: guard(() => {
        if (this.state.status === 'paused') adapter.pause();
        if (!this.state.ready || this.state.error === adapter.stallHint) this.#set({ ready: true, error: '' });
      }),
      onError: guard(msg => this.#set({ ready: true, error: msg + ' Le temps continue.' })),
    });
  }

  #applyVolume(v) {
    v = Math.round(v * 100) / 100;
    if (v === this.#volume) return;
    this.#volume = v;
    this.#adapter()?.setVolume(v);
  }

  #cancelBeeps() {
    if (this.#beepsScheduled) this.#beeper?.cancel();
    this.#beepsScheduled = false;
  }

  #clearTimeouts() {
    this.#timeouts.forEach(clearTimeout);
    this.#timeouts = [];
  }

  #teardown() {
    this.#token++;
    this.#cancelBeeps();
    this.#clearTimeouts();
    clearInterval(this.#timer);
    this.#timer = null;
    for (const a of Object.values(this.#media)) a.stop();
    this.#wakeLock?.release();
  }

  #finish() {
    this.#teardown();
    this.#set({ status: 'done', remaining: 0 });
  }
}
