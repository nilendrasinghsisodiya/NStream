import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    hookTimeout: 60_000,
    testTimeout: 60_000,
    include: ['src/__tests__/__integration__/*.test.js'],
    globalSetup: 'src/__tests__/__integration__/setup/global-setup.js',
    setupFiles: 'src/__tests__/__integration__/setup/env-setup.js',
    environment: 'node',
  },
});
