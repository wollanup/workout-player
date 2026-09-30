import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme.js';

export function Providers({ children }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Notifications position="top-center" />
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
}
