import { useLocalStorage } from '@mantine/hooks';
import { ACCENT_KEY, DEFAULT_ACCENT } from '../app/theme.js';

/** Accent color, persisted and synced between every component using it. */
export const useAccent = () =>
  useLocalStorage({ key: ACCENT_KEY, defaultValue: DEFAULT_ACCENT, getInitialValueInEffect: false });
