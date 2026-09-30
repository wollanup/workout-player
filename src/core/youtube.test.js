import { describe, it, expect, vi } from 'vitest';
import { parseYouTube, parseYtT, fetchOEmbed, ytErrorMessage } from './youtube.js';

describe('parseYouTube', () => {
  it.each([
    ['dQw4w9WgXcQ', { videoId: 'dQw4w9WgXcQ' }],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', { videoId: 'dQw4w9WgXcQ' }],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=abc', { videoId: 'dQw4w9WgXcQ' }],
    ['https://youtu.be/dQw4w9WgXcQ?t=90', { videoId: 'dQw4w9WgXcQ', start: 90 }],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s', { videoId: 'dQw4w9WgXcQ', start: 90 }],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', { videoId: 'dQw4w9WgXcQ' }],
    ['https://music.youtube.com/playlist?list=PLabcdefghijKLMN', { list: 'PLabcdefghijKLMN' }],
    ['https://music.youtube.com/browse/VLPLabcdefghijKLMN?list=VLPLabcdefghijKLMN', { list: 'PLabcdefghijKLMN' }],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabcdefghijKLMN', { videoId: 'dQw4w9WgXcQ', list: 'PLabcdefghijKLMN' }],
    ['PLabcdefghijKLMN', { list: 'PLabcdefghijKLMN' }],
  ])('%s', (input, expected) => expect(parseYouTube(input)).toEqual(expected));

  it.each(['', 'hello', 'https://example.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch'])(
    'rejects %s', input => expect(parseYouTube(input)).toEqual({}));
});

it('parseYtT', () => {
  expect(parseYtT('45')).toBe(45);
  expect(parseYtT('45s')).toBe(45);
  expect(parseYtT('1h2m3s')).toBe(3723);
  expect(parseYtT('garbage')).toBe(0);
  expect(parseYtT(null)).toBe(0);
});

describe('fetchOEmbed', () => {
  it('returns title and channel', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ title: 'Song', author_name: 'Band - Topic' }) });
    expect(await fetchOEmbed('dQw4w9WgXcQ', f)).toEqual({ title: 'Song', author: 'Band - Topic' });
    expect(f.mock.calls[0][0]).toContain('oembed');
  });

  it('returns null on failure', async () => {
    expect(await fetchOEmbed('x', vi.fn().mockResolvedValue({ ok: false }))).toBeNull();
    expect(await fetchOEmbed('x', vi.fn().mockRejectedValue(new Error('net')))).toBeNull();
  });
});

it('ytErrorMessage', () => {
  expect(ytErrorMessage(153)).toMatch(/referrer/);
  expect(ytErrorMessage(999)).toBe('Erreur YouTube 999.');
});
