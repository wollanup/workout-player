/** "3:00" -> 180, "1:02:03" -> 3723, "90" -> 90. Returns NaN when invalid. */
export function parseTime(v) {
  if (typeof v === 'number') return v;
  const str = String(v ?? '').trim();
  if (!str) return NaN;
  const parts = str.split(':').map(Number);
  if (parts.some(n => !Number.isFinite(n) || n < 0)) return NaN;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** Seconds -> "m:ss" / "h:mm:ss", rounded up (countdown friendly). */
export function formatTime(sec) {
  sec = Math.max(0, Math.ceil(sec - 1e-6));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = String(sec % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export const clamp01 = v => Math.min(1, Math.max(0, v));

/** Quick-pick durations in the editor (seconds). */
export const MUSIC_PRESETS = [60, 120, 180, 300];
export const PAUSE_PRESETS = [10, 20, 30, 60];

/** Short setting in seconds: "5 s", or "Non" for 0 (feature off). */
export const formatSeconds = v => (v > 0 ? `${v} s` : 'Non');
