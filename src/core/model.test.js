import { describe, it, expect } from 'vitest';
import {
  newSession, newMusic, newPause, totalDuration, stepTitle, buildRunSteps, validateSession, stepsFromPlaylist,
} from './model.js';
import { beepTimes, beepPlan } from './beeps.js';

describe('model', () => {
  it('totalDuration includes lead', () => {
    const s = { ...newSession(), lead: 5, steps: [newMusic('yt', { duration: 180 }), newPause(20)] };
    expect(totalDuration(s)).toBe(205);
  });

  it('stepTitle falls back sensibly', () => {
    expect(stepTitle(newPause())).toBe('Pause');
    expect(stepTitle(newMusic('local', { fileName: 'a.mp3' }))).toBe('a.mp3');
    expect(stepTitle(newMusic('yt', { videoId: 'abc', label: 'Song' }))).toBe('Song');
  });

  it('buildRunSteps prepends lead and skips zero-length steps', () => {
    const s = { ...newSession(), lead: 3, steps: [newPause(0), newMusic('yt', { videoId: 'x' })] };
    const steps = buildRunSteps(s);
    expect(steps.map(x => x.type)).toEqual(['pause', 'music']);
    expect(steps[0]).toMatchObject({ lead: true, duration: 3 });
    expect(buildRunSteps({ ...s, lead: 0 })).toHaveLength(1);
    expect(buildRunSteps({ ...s, steps: [] })).toEqual([]);
  });

  it('validateSession', () => {
    expect(validateSession(newSession())).toEqual(['Ajoute au moins une étape.']);
    const s = { ...newSession(), steps: [newMusic('yt'), newMusic('local', { fileId: 'f' }), newPause(0)] };
    expect(validateSession(s)).toEqual(['Étape 1 : aucune musique sélectionnée.', 'Étape 3 : durée invalide.']);
  });

  it('stepsFromPlaylist interleaves pauses', () => {
    const steps = stepsFromPlaylist(['a', 'b', 'c'], 120, 20);
    expect(steps.map(s => s.type)).toEqual(['music', 'pause', 'music', 'pause', 'music']);
    expect(steps[0]).toMatchObject({ source: 'yt', videoId: 'a', duration: 120 });
    expect(stepsFromPlaylist(['a', 'b'], 60, 0)).toHaveLength(2);
  });
});

describe('beeps', () => {
  it('beep times start 1 s apart then accelerate', () => {
    const t = beepTimes(5);
    expect(t[0]).toBe(5);
    expect(t[1]).toBe(4);
    const gaps = t.slice(1).map((x, i) => t[i] - x);
    gaps.slice(1).forEach((g, i) => expect(g).toBeLessThanOrEqual(gaps[i] + 1e-9));
    expect(Math.min(...t)).toBeGreaterThan(0);
  });

  it('plan only contains beeps within the remaining time, ends with a long beep', () => {
    const plan = beepPlan(2, 5);
    expect(plan.every(b => b.offset >= 0 && b.offset <= 2)).toBe(true);
    expect(plan.at(-1)).toMatchObject({ offset: 2, freq: 660 });
    expect(beepPlan(0, 5)).toHaveLength(1);
  });

  it('countdown pitch rises subtly (2 semitones), final beep one octave above the start', () => {
    const plan = beepPlan(5, 5);
    const ticks = plan.slice(0, -1).map(b => b.freq);
    expect(ticks[0]).toBe(330);
    expect(ticks.at(-1)).toBeCloseTo(330 * 2 ** (2 / 12)); // ~370 Hz
    ticks.slice(1).forEach((f, i) => expect(f).toBeGreaterThanOrEqual(ticks[i]));
  });
});
