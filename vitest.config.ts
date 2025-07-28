import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/unit/**/*.test.ts'],
          globals: true,
        },
      },
      {
        test: {
          name: 'integration:generation',
          environment: 'node',
          include: ['test/integration/tests/generation/**/*.test.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'integration:schema',
          environment: 'node',
          include: ['test/integration/tests/schema/**/*.test.ts'],
          globals: true,
        },
      },
    ],
  },
});
