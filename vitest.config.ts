import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      // Test-only secret. Never reuse a real one here.
      JWT_SECRET: 'test-secret-do-not-use-in-production-0123456789',
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
});
