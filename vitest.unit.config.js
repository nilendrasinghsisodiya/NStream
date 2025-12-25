import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/__unit__/*.test.js'],
    testTimeout: 60_000,
    hookTimeout: 60_00, // container startup
  },
});
