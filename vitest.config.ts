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
    include: ['server/tests/unit/**/*.test.ts'],
    globals: false,
    clearMocks: true,
    restoreMocks: true,
  },
});
