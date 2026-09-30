import { fetchOEmbed } from '../core/youtube.js';
import { localLabel, youTubeLabel } from '../core/tracks.js';

/**
 * @typedef {{label: string, trackDuration?: number}} TrackInfo
 */

function audioElementDuration(blob, timeoutMs = 5000) {
  return new Promise(resolve => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    const done = d => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      audio.removeAttribute('src');
      resolve(Number.isFinite(d) && d > 0 ? d : undefined);
    };
    const timer = setTimeout(() => done(), timeoutMs);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => done(audio.duration);
    audio.onerror = () => done();
    audio.src = url;
  });
}

/** Local audio file: tags (ID3, Vorbis, MP4…) + duration. Never throws. */
export async function localTrackInfo(file) {
  let tags = {};
  let duration;
  try {
    const { parseBlob } = await import('music-metadata');
    const meta = await parseBlob(file, { duration: true, skipCovers: true });
    tags = { artist: meta.common.artist, title: meta.common.title };
    duration = meta.format.duration;
  } catch { /* unsupported format: fall back below */ }
  if (!(duration > 0)) duration = await audioElementDuration(file);
  return { label: localLabel(tags, file.name), trackDuration: duration };
}

/** YouTube video: duration from the embedded player, title/channel from the player or oEmbed. Never throws. */
export async function youTubeTrackInfo(youtube, videoId) {
  const probed = await youtube.probe(videoId).catch(() => null);
  // The player often gives no channel name: oEmbed has it, needed for "Artiste - Titre".
  const meta = probed?.title && probed.author ? probed : { ...probed, ...await fetchOEmbed(videoId) };
  return { label: youTubeLabel(meta || {}), trackDuration: probed?.duration };
}
