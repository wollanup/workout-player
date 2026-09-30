import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `--mode mobile`: self-signed HTTPS so the phone gets a secure context
// (Wake Lock, Service Worker) when reaching the dev server via the LAN IP.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'mobile' ? [basicSsl()] : [])],
  server: { port: 5173 },
  preview: { port: 4173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['src/test/setup.js'],
  },
}));
