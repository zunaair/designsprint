import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    root: '.',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.ts'],
      exclude: ['src/**/*.module.ts', 'src/**/*.dto.ts', 'src/**/index.ts', 'src/main.ts'],
      thresholds: {
        'src/modules/crawler/': { statements: 80, branches: 70, functions: 80, lines: 80 },
      },
    },
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, './src'),
      '@designsprint/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
