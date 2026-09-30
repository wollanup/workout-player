import { describe, it, expect, vi } from 'vitest';
import { createAppleMusicAdapter } from './appleMusic.js';

function fakeMusicKit({ authorized = true } = {}) {
  const handlers = {};
  const music = {
    isAuthorized: authorized,
    playbackState: 0,
    volume: 1,
    addEventListener: (name, fn) => { handlers[name] = fn; },
    authorize: vi.fn(async () => { music.isAuthorized = true; handlers.authorizationStatusDidChange?.(); }),
    unauthorize: vi.fn(async () => { music.isAuthorized = false; }),
    setQueue: vi.fn(async () => {}),
    play: vi.fn(async () => { music.playbackState = 2; handlers.playbackStateDidChange?.({ state: 2 }); }),
    pause: vi.fn(),
    seekToTime: vi.fn(async () => {}),
    api: { music: vi.fn() },
    emit: (name, e) => handlers[name]?.(e),
  };
  const win = { MusicKit: { configure: vi.fn(async () => music) }, document: {} };
  return { music, win };
}

const song = (id, name, ms) => ({ id, type: 'songs', attributes: { name, artistName: 'Artist', durationInMillis: ms, playParams: { id } } });

describe('Apple Music adapter', () => {
  it('is unavailable without developer token', async () => {
    const apple = createAppleMusicAdapter({});
    expect(apple.configured).toBe(false);
    expect(await apple.init()).toBe(false);
  });

  it('plays a song from its start point, then reports playing', async () => {
    const { music, win } = fakeMusicKit();
    const apple = createAppleMusicAdapter({ developerToken: 'jwt', win });
    const cb = { onPlaying: vi.fn(), onError: vi.fn() };
    await apple.load({ appleId: '42', start: 30 }, cb);
    expect(win.MusicKit.configure).toHaveBeenCalledWith(expect.objectContaining({ developerToken: 'jwt' }));
    expect(music.setQueue).toHaveBeenCalledWith({ song: '42', startPlaying: false });
    expect(music.seekToTime).toHaveBeenCalledWith(30);
    expect(cb.onPlaying).toHaveBeenCalled();
    expect(cb.onError).not.toHaveBeenCalled();

    apple.setVolume(0.4);
    expect(music.volume).toBe(0.4);
    apple.pause();
    expect(music.pause).toHaveBeenCalled();
  });

  it('loops to the start point when the track ends before the step', async () => {
    const { music, win } = fakeMusicKit();
    const apple = createAppleMusicAdapter({ developerToken: 'jwt', win });
    await apple.load({ appleId: '42', start: 10 }, { onPlaying() {}, onError() {} });
    music.seekToTime.mockClear();
    music.emit('playbackStateDidChange', { state: 10 });
    expect(music.seekToTime).toHaveBeenCalledWith(10);
  });

  it('asks to sign in instead of playing 30 s previews', async () => {
    const { music, win } = fakeMusicKit({ authorized: false });
    const apple = createAppleMusicAdapter({ developerToken: 'jwt', win });
    const cb = { onPlaying: vi.fn(), onError: vi.fn() };
    await apple.load({ appleId: '42', start: 0 }, cb);
    expect(cb.onError).toHaveBeenCalledWith(expect.stringMatching(/Connecte ton compte Apple Music/));
    expect(music.play).not.toHaveBeenCalled();
  });

  it('notifies subscribers on sign-in', async () => {
    const { win } = fakeMusicKit({ authorized: false });
    const apple = createAppleMusicAdapter({ developerToken: 'jwt', win });
    const fn = vi.fn();
    apple.subscribe(fn);
    expect(apple.isAuthorized()).toBe(false);
    await apple.authorize();
    expect(apple.isAuthorized()).toBe(true);
    expect(fn).toHaveBeenCalled();
  });

  it('prepares the next song while idle and reuses the queue', async () => {
    const { music, win } = fakeMusicKit();
    const apple = createAppleMusicAdapter({ developerToken: 'jwt', win });
    await apple.init();
    apple.prepare({ appleId: '7' });
    expect(music.setQueue).toHaveBeenCalledTimes(1);
    await apple.load({ appleId: '7', start: 0 }, { onPlaying() {}, onError() {} });
    expect(music.setQueue).toHaveBeenCalledTimes(1);
    expect(music.play).toHaveBeenCalled();
  });

  it('searches the catalog and reads paginated playlist tracks', async () => {
    const { music, win } = fakeMusicKit();
    const apple = createAppleMusicAdapter({ developerToken: 'jwt', win });
    music.api.music.mockResolvedValueOnce({ data: { results: { songs: { data: [song('1', 'A', 60000)] } } } });
    expect(await apple.search('a')).toEqual([{ appleId: '1', label: 'Artist - A', trackDuration: 60, artwork: undefined }]);
    expect(music.api.music).toHaveBeenLastCalledWith('/v1/catalog/{{storefrontId}}/search', { term: 'a', types: 'songs', limit: 8 });

    music.api.music
      .mockResolvedValueOnce({ data: { data: [song('1', 'A', 1000), { id: 'v', type: 'music-videos', attributes: {} }], next: '/next' } })
      .mockResolvedValueOnce({ data: { data: [song('2', 'B', 2000)] } });
    const tracks = await apple.tracks({ playlistId: 'pl.x', storefront: 'fr' });
    expect(music.api.music).toHaveBeenCalledWith('/v1/catalog/fr/playlists/pl.x/tracks', { limit: 100 });
    expect(music.api.music).toHaveBeenLastCalledWith('/next');
    expect(tracks.map(t => t.appleId)).toEqual(['1', '2']);

    music.api.music.mockResolvedValueOnce({ data: { data: [] } });
    await apple.tracks({ playlistId: 'p.mine', library: true });
    expect(music.api.music).toHaveBeenLastCalledWith('/v1/me/library/playlists/p.mine/tracks', { limit: 100 });
  });
});
