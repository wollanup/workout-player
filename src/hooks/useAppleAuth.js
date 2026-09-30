import { useEffect, useSyncExternalStore } from 'react';

const noop = () => () => {};
const no = () => false;

/**
 * True when the user is signed in to Apple Music (re-renders on sign-in / sign-out).
 * Loads MusicKit on first use so a previous sign-in is detected.
 */
export function useAppleAuth(apple) {
  useEffect(() => { if (apple?.configured) apple.init?.(); }, [apple]);
  return useSyncExternalStore(apple?.subscribe ?? noop, apple?.isAuthorized ?? no);
}
