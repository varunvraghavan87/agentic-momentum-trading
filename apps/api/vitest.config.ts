import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@amt/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
