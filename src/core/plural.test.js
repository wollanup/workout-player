import { describe, it, expect } from 'vitest';
import { plural } from './plural.js';

describe('plural', () => {
  it('agrees in French (0 and 1 singular)', () => {
    expect(plural(0, 'étape')).toBe('0 étape');
    expect(plural(1, 'étape')).toBe('1 étape');
    expect(plural(2, 'étape')).toBe('2 étapes');
    expect(plural(12, 'morceau', 'morceaux')).toBe('12 morceaux');
  });
});
