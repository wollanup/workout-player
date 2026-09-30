import { createTheme } from '@mantine/core';

/** Accent colors offered in the theme menu (Mantine palette names). */
export const ACCENTS = ['green', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'grape', 'pink', 'red', 'orange', 'yellow', 'lime'];
export const ACCENT_KEY = 'wp.accent';
export const DEFAULT_ACCENT = 'green';

export const makeTheme = accent => createTheme({
  primaryColor: ACCENTS.includes(accent) ? accent : DEFAULT_ACCENT,
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
});
