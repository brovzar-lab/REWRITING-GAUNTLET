/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 127.0.0.1 (not the default 'localhost') so the server answers on IPv4;
    // node 22 resolves 'localhost' to ::1 and Vite would bind IPv6 only.
    host: '127.0.0.1',
    port: 5213,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5213,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    globals: true,
  },
});
