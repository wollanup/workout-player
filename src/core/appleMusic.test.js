import { describe, it, expect } from 'vitest';
import { appleTrack, parseAppleMusic } from './appleMusic.js';

describe('parseAppleMusic', () => {
  it('reads songs, album tracks, albums and playlists', () => {
    expect(parseAppleMusic('https://music.apple.com/fr/song/harder-better-faster-stronger/697195787'))
      .toEqual({ storefront: 'fr', songId: '697195787' });
    expect(parseAppleMusic('https://music.apple.com/us/album/discovery/697194953?i=697195787'))
      .toEqual({ storefront: 'us', songId: '697195787' });
    expect(parseAppleMusic('https://music.apple.com/fr/album/discovery/697194953'))
      .toEqual({ storefront: 'fr', albumId: '697194953' });
    expect(parseAppleMusic('https://music.apple.com/fr/playlist/workout/pl.u-8aAVZAqsxLvXeA'))
      .toEqual({ storefront: 'fr', playlistId: 'pl.u-8aAVZAqsxLvXeA' });
    expect(parseAppleMusic('https://music.apple.com/library/playlist/p.ZOAXxLpC4kMB'))
      .toEqual({ library: true, playlistId: 'p.ZOAXxLpC4kMB' });
    expect(parseAppleMusic('697195787')).toEqual({ songId: '697195787' });
  });

  it('rejects other links and plain text', () => {
    expect(parseAppleMusic('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({});
    expect(parseAppleMusic('daft punk')).toEqual({});
    expect(parseAppleMusic('https://music.apple.com/fr/artist/daft-punk/5468295')).toEqual({});
  });
});

describe('appleTrack', () => {
  it('builds "Artiste - Titre", duration in seconds and the id to play', () => {
    expect(appleTrack({
      id: 'i.abc', type: 'library-songs',
      attributes: {
        name: 'One More Time', artistName: 'Daft Punk', durationInMillis: 320357,
        playParams: { id: 'i.abc', catalogId: '697195462' }, artwork: { url: 'https://x/{w}x{h}bb.jpg' },
      },
    })).toEqual({ appleId: '697195462', label: 'Daft Punk - One More Time', trackDuration: 320.357, artwork: 'https://x/80x80bb.jpg' });
    expect(appleTrack({ id: '1', attributes: { name: 'Solo' } })).toMatchObject({ appleId: '1', label: 'Solo', trackDuration: undefined });
  });
});
