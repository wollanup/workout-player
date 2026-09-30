import { useLocalStorage } from '@mantine/hooks';
import { SOURCES_KEY, activeSources } from '../core/sources.js';

/**
 * Music sources switched on in the menu, persisted and shared by every component using it.
 * @param {{configured?: boolean}|null} apple Apple Music service (unavailable without developer token)
 * @returns {{active: string[], prefs: Record<string, boolean>, available: Record<string, boolean>, setEnabled: (id: string, on: boolean) => void}}
 */
export function useSources(apple) {
  const [prefs, setPrefs] = useLocalStorage({ key: SOURCES_KEY, defaultValue: {}, getInitialValueInEffect: false });
  const available = { apple: !!apple?.configured };
  return {
    prefs,
    available,
    active: activeSources(prefs, available),
    setEnabled: (id, on) => setPrefs(p => ({ ...p, [id]: on })),
  };
}
