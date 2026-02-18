import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    },
    include: [
      'scripts/**/*.test.{js,mjs}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'archive'
    ],
    reporters: ['default']
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './core'),
      '@app': path.resolve(__dirname, './app')
    }
  }
});
