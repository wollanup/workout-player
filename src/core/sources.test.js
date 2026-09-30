import { describe, it, expect } from 'vitest';
import { activeSources } from './sources.js';

describe('activeSources', () => {
  it('keeps enabled and available sources, in display order', () => {
    expect(activeSources({}, {})).toEqual(['yt', 'apple', 'local']);
    expect(activeSources({ yt: false }, {})).toEqual(['apple', 'local']);
    expect(activeSources({}, { apple: false })).toEqual(['yt', 'local']);
  });

  it('never returns an empty list', () => {
    expect(activeSources({ yt: false, local: false }, { apple: false })).toEqual(['yt', 'local']);
  });
});
