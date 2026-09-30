import { it, expect } from 'vitest';
import { sessionProgress } from './progress.js';

const steps = [{ duration: 5 }, { duration: 60 }, { duration: 20 }];

it('computes elapsed / left over the whole session', () => {
  expect(sessionProgress({ status: 'running', steps, idx: 1, duration: 60, remaining: 45 }))
    .toEqual({ total: 85, elapsed: 20, left: 65 });
  expect(sessionProgress({ status: 'done', steps, idx: 2, duration: 20, remaining: 0 }))
    .toEqual({ total: 85, elapsed: 85, left: 0 });
});
