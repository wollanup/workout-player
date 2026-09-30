import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkoutEngine } from './engine.js';

function fakeAdapter() {
  const a = {
    cb: null,
    step: null,
    load: vi.fn((step, cb) => { a.step = step; a.cb = cb; }),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(() => { a.cb = null; }),
    setVolume: vi.fn(),
    prepare: vi.fn(),
    preload: vi.fn(),
    stallHint: 'touch it',
  };
  return a;
}

const session = {
  id: 's', name: 'Test', lead: 0, countdown: 3,
  steps: [
    { id: '1', type: 'music', source: 'yt', videoId: 'v1', duration: 10, start: 30, fade: 2 },
    { id: '2', type: 'pause', duration: 5 },
    { id: '3', type: 'music', source: 'local', fileId: 'f', duration: 4, start: 0, fade: 0 },
  ],
};

describe('WorkoutEngine', () => {
  let clock, yt, local, beeper, wakeLock, engine;
  const advance = sec => { clock += sec * 1000; engine.tick(); };

  beforeEach(() => {
    vi.useFakeTimers();
    clock = 0;
    yt = fakeAdapter();
    local = fakeAdapter();
    beeper = { unlock: vi.fn(), schedule: vi.fn(), cancel: vi.fn() };
    wakeLock = { acquire: vi.fn(), release: vi.fn() };
    engine = new WorkoutEngine({ media: { yt, local }, beeper, wakeLock, now: () => clock, autoTick: false });
  });
  afterEach(() => vi.useRealTimers());

  it('plays steps in order with the right durations', () => {
    engine.start(session);
    expect(wakeLock.acquire).toHaveBeenCalled();
    expect(yt.preload).toHaveBeenCalled();
    expect(yt.load).toHaveBeenCalledWith(session.steps[0], expect.any(Object));
    expect(engine.state).toMatchObject({ status: 'running', idx: 0, ready: false });

    // Timer waits for media to actually play.
    advance(2);
    expect(engine.state.remaining).toBe(10);
    yt.cb.onPlaying();
    advance(4);
    expect(engine.state.remaining).toBe(6);

    advance(6);
    expect(engine.state).toMatchObject({ idx: 1, ready: true, remaining: 5 });
    expect(yt.stop).toHaveBeenCalled();

    advance(5);
    expect(engine.state.idx).toBe(2);
    expect(local.load).toHaveBeenCalled();
    local.cb.onPlaying();
    advance(4);
    expect(engine.state.status).toBe('done');
    expect(wakeLock.release).toHaveBeenCalled();
  });

  it('schedules countdown beeps once, and fades out', () => {
    engine.start(session);
    yt.cb.onPlaying();
    advance(6.5); // 3.5 s left
    expect(beeper.schedule).not.toHaveBeenCalled();
    advance(1); // 2.5 s left
    expect(beeper.schedule).toHaveBeenCalledTimes(1);
    expect(beeper.schedule.mock.calls[0][0].at(-1).offset).toBeCloseTo(2.5);
    advance(1.5); // 1 s left, fade 2 s -> 50 %
    expect(beeper.schedule).toHaveBeenCalledTimes(1);
    expect(yt.setVolume).toHaveBeenLastCalledWith(0.5);
  });

  it('pause freezes time and cancels beeps, resume continues', () => {
    engine.start(session);
    yt.cb.onPlaying();
    advance(8);
    engine.togglePause();
    expect(engine.state.status).toBe('paused');
    expect(yt.pause).toHaveBeenCalled();
    expect(beeper.cancel).toHaveBeenCalled();
    advance(30);
    expect(engine.state.remaining).toBe(2);
    engine.togglePause();
    expect(yt.resume).toHaveBeenCalled();
    advance(1);
    expect(engine.state.remaining).toBe(1);
    expect(beeper.schedule).toHaveBeenCalledTimes(2); // rescheduled after resume
  });

  it('media error does not block the session', () => {
    engine.start(session);
    yt.cb.onError('Lecture intégrée interdite.');
    expect(engine.state.ready).toBe(true);
    expect(engine.state.error).toMatch(/interdite/);
    advance(10);
    expect(engine.state.idx).toBe(1);
    expect(engine.state.error).toBe('');
  });

  it('shows a stall hint then starts the timer anyway', () => {
    engine.start(session);
    vi.advanceTimersByTime(4000);
    expect(engine.state.error).toBe('touch it');
    vi.advanceTimersByTime(6000);
    expect(engine.state.ready).toBe(true);
  });

  it('ignores callbacks from a previous step', () => {
    engine.start(session);
    const oldCb = yt.cb;
    engine.next();
    oldCb.onError('stale');
    expect(engine.state.error).toBe('');
  });

  it('prev restarts current step if started for a while, else previous step', () => {
    engine.start(session);
    engine.next();
    advance(4);
    engine.prev();
    expect(engine.state).toMatchObject({ idx: 1, remaining: 5 });
    engine.prev();
    expect(engine.state.idx).toBe(0);
  });

  it('adds a lead step and restarts when done', () => {
    engine.start({ ...session, lead: 5 });
    expect(engine.state).toMatchObject({ hasLead: true, idx: 0, ready: true });
    expect(yt.load).not.toHaveBeenCalled();
    engine.stop();
    expect(engine.state.status).toBe('idle');
  });

  it('pre-buffers the next track when its player is idle', () => {
    engine.start(session);
    // yt step followed by a pause: nothing to prepare yet.
    expect(local.prepare).not.toHaveBeenCalled();
    engine.next();
    // During the pause, the next (local) track is prepared.
    expect(local.prepare).toHaveBeenCalledWith(session.steps[2]);
    expect(yt.prepare).not.toHaveBeenCalled();

    engine.start({ ...session, lead: 5 });
    // Lead step prepares the first YouTube track.
    expect(yt.prepare).toHaveBeenCalledWith(session.steps[0]);
  });

  it('does not prepare with the adapter currently playing', () => {
    const s = { ...session, steps: [session.steps[0], { ...session.steps[0], id: '4', videoId: 'v2' }] };
    engine.start(s);
    expect(yt.prepare).not.toHaveBeenCalled();
  });

  it('notifies subscribers with new state objects', () => {
    const seen = [];
    engine.subscribe(s => seen.push(s));
    engine.start(session);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(s => s.steps[s.idx])).toBe(true);
    expect(new Set(seen).size).toBe(seen.length);
  });
});
