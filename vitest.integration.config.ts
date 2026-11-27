import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@server': `${rootDir}server/src`,
      '@': `${rootDir}src`,
    },
  },

  test: {
    environment: 'node',
    include: ['server/tests/integration/**/*.test.ts'],
    setupFiles: ['./server/tests/setup/test-environment.ts'],
    globals: false,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
