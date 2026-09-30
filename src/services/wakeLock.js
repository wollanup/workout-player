/** Keeps the screen on during a session (needed for YouTube playback on mobile). Requires HTTPS. */
export function createWakeLock() {
  let lock = null;
  let wanted = false;

  async function acquire() {
    wanted = true;
    try { lock = await navigator.wakeLock?.request('screen'); } catch { /* unsupported / denied */ }
  }

  // The lock is released automatically when the page is hidden: take it back on return.
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible') acquire();
  });

  return {
    acquire,
    release() {
      wanted = false;
      lock?.release().catch(() => {});
      lock = null;
    },
  };
}
