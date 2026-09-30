import { describe, it, expect } from 'vitest';
import { parseTime, formatTime, clamp01 } from './time.js';

describe('parseTime', () => {
  it.each([
    ['3:00', 180], ['0:20', 20], ['90', 90], ['1:02:03', 3723], [' 5:05 ', 305], [42, 42],
  ])('%s -> %s', (input, expected) => expect(parseTime(input)).toBe(expected));

  it.each(['', 'abc', '1:-2', null, undefined])('invalid %s -> NaN', input => {
    expect(parseTime(input)).toBeNaN();
  });
});

describe('formatTime', () => {
  it.each([[0, '0:00'], [5, '0:05'], [180, '3:00'], [3723, '1:02:03'], [-3, '0:00']])(
    '%s -> %s', (sec, expected) => expect(formatTime(sec)).toBe(expected));

  it('rounds up for countdown display', () => {
    expect(formatTime(4.2)).toBe('0:05');
    expect(formatTime(0.01)).toBe('0:01');
  });
});

it('clamp01', () => {
  expect([-1, 0.5, 2].map(clamp01)).toEqual([0, 0.5, 1]);
});
