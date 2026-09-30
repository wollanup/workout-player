import { describe, it, expect } from 'vitest';
import { cleanTitle, cleanArtist, youTubeLabel, localLabel, trackFit } from './tracks.js';

describe('cleanTitle', () => {
  it.each([
    ['Get Lucky (Official Video)', 'Get Lucky'],
    ['Numb [Official Music Video] (HD)', 'Numb'],
    ['Here Comes the Sun (Remastered 2009)', 'Here Comes the Sun'],
    ['Song (feat. Someone)', 'Song (feat. Someone)'],
    ['Titre (Clip officiel)', 'Titre'],
  ])('%s', (input, expected) => expect(cleanTitle(input)).toBe(expected));
});

it('cleanArtist', () => {
  expect(cleanArtist('Daft Punk - Topic')).toBe('Daft Punk');
  expect(cleanArtist('DaftPunkVEVO')).toBe('DaftPunk');
  expect(cleanArtist('Linkin Park Official')).toBe('Linkin Park');
});

describe('youTubeLabel', () => {
  it('YT Music auto-generated channel', () => {
    expect(youTubeLabel({ title: 'Get Lucky', author: 'Daft Punk - Topic' })).toBe('Daft Punk - Get Lucky');
  });
  it('keeps titles already formatted as "Artist - Title"', () => {
    expect(youTubeLabel({ title: 'Daft Punk - Get Lucky (Official Audio)', author: 'Daft Punk' }))
      .toBe('Daft Punk - Get Lucky');
  });
  it('prefixes the channel name otherwise', () => {
    expect(youTubeLabel({ title: 'Numb (Official Video)', author: 'Linkin Park' })).toBe('Linkin Park - Numb');
  });
  it('handles missing data', () => {
    expect(youTubeLabel({ title: 'Solo' })).toBe('Solo');
    expect(youTubeLabel()).toBe('');
  });
});

it('localLabel', () => {
  expect(localLabel({ artist: 'Muse', title: 'Uprising' }, 'x.mp3')).toBe('Muse - Uprising');
  expect(localLabel({ title: 'Uprising' }, 'x.mp3')).toBe('Uprising');
  expect(localLabel({}, 'muse_-_uprising.mp3')).toBe('muse - uprising');
});

describe('trackFit', () => {
  const step = extra => ({ type: 'music', duration: 180, start: 0, ...extra });
  it('null when unknown', () => {
    expect(trackFit(step())).toBeNull();
    expect(trackFit({ type: 'pause', duration: 20 })).toBeNull();
  });
  it('fits', () => expect(trackFit(step({ trackDuration: 200.4 }))).toEqual({ available: 200, overrun: -20 }));
  it('too short once start is taken into account', () => {
    expect(trackFit(step({ trackDuration: 200, start: 40 }))).toEqual({ available: 160, overrun: 20 });
  });
  it('start beyond the end', () => {
    expect(trackFit(step({ trackDuration: 100, start: 120 }))).toEqual({ available: 0, overrun: 180 });
  });
});
