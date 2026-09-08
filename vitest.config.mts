import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    // Mirror the `@/*` path alias from tsconfig.json.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Everything under test is pure logic; nothing needs a DOM. The two
    // suites that touch browser APIs stub them explicitly.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
