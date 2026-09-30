import { useMemo } from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { makeTheme } from './theme.js';
import { useAccent } from '../hooks/useAccent.js';

export function Providers({ children }) {
  const [accent] = useAccent();
  const theme = useMemo(() => makeTheme(accent), [accent]);
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Notifications position="top-center" />
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
}
