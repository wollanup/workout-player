import { describe, it, expect } from 'vitest';
import {
  newSession, newMusic, newPause, totalDuration, stepTitle, buildRunSteps, validateSession, stepsFromTracks,
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
    const s = { ...newSession(), steps: [newMusic('yt'), newMusic('local', { fileId: 'f' }), newPause(0), newMusic('apple'), newMusic('apple', { appleId: '1' })] };
    expect(validateSession(s)).toEqual([
      'Étape 1 : aucune musique sélectionnée.', 'Étape 3 : durée invalide.', 'Étape 4 : aucune musique sélectionnée.',
    ]);
  });

  it('stepsFromTracks interleaves pauses', () => {
    const steps = stepsFromTracks('yt', ['a', 'b', 'c'].map(videoId => ({ videoId })), { duration: 120, pause: 20 });
    expect(steps.map(s => s.type)).toEqual(['music', 'pause', 'music', 'pause', 'music']);
    expect(steps[0]).toMatchObject({ source: 'yt', videoId: 'a', duration: 120 });
    expect(stepsFromTracks('yt', [{ videoId: 'a' }, { videoId: 'b' }], { duration: 60 })).toHaveLength(2);
  });

  it('stepsFromTracks keeps track info and can use whole tracks', () => {
    const tracks = [
      { appleId: '1', label: 'A - B', trackDuration: 200.6, artwork: 'x' },
      { appleId: '2', label: 'C - D' },
    ];
    const [a, b] = stepsFromTracks('apple', tracks, { duration: 90, wholeTrack: true });
    expect(a).toMatchObject({ source: 'apple', appleId: '1', label: 'A - B', trackDuration: 200.6, duration: 200 });
    expect(a).not.toHaveProperty('artwork');
    expect(b).toMatchObject({ appleId: '2', duration: 90 });
  });
});

describe('beeps', () => {
  it('rhythm: 2 quarter notes then 4 eighth notes, 1 s per beat', () => {
    expect(beepTimes(5)).toEqual([4, 3, 2, 1.5, 1, 0.5]);
  });

  it('squeezes the rhythm into a short countdown', () => {
    expect(beepTimes(2)).toEqual([2, 1.5, 1, 0.75, 0.5, 0.25]);
  });

  it('quarter notes are long, eighth notes short, all at the same pitch', () => {
    const plan = beepPlan(5, 5);
    expect(plan.map(b => b.offset)).toEqual([1, 2, 3, 3.5, 4, 4.5, 5]);
    expect(new Set(plan.map(b => b.freq))).toEqual(new Set([300]));
    const [q1, q2, ...rest] = plan.slice(0, -1);
    rest.forEach(e => expect(e.len).toBeLessThan(q1.len));
    expect(q2.len).toBe(q1.len);
  });

  it('plan only contains beeps within the remaining time, ends with a long beep', () => {
    const plan = beepPlan(2, 5);
    expect(plan.every(b => b.offset >= 0 && b.offset <= 2)).toBe(true);
    expect(plan.at(-1)).toMatchObject({ offset: 2, freq: 300, len: 0.5 });
    expect(beepPlan(0, 5)).toHaveLength(1);
  });
});
