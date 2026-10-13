import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/firebase.integration.test.ts'],
    environment: 'node',
    testTimeout: 15000,
    fileParallelism: false,
  },
});
