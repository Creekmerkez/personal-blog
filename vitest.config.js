import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Separate from vite.config.js on purpose: keeps the production build config
// free of test-only wiring (setupFiles, jsdom environment) that has no
// business being part of `npm run build`.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    css: false,
    // e2e/ is Playwright's territory, not Vitest's. `.agents` / `.claude` hold
    // third-party Claude Code skill packages that ship their own tests written
    // for Node's built-in runner — running them here fails and hides ours.
    exclude: ['node_modules/**', 'e2e/**', 'dist/**', '.agents/**', '.claude/**'],
  },
});
