import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    // One in-memory MongoDB per file; run files sequentially to keep it light.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000, // first in-memory Mongo startup can be slow
  },
});
