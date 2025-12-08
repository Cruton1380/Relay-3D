import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/setupTests.mjs'],
    testTimeout: 30000, // 30 second timeout for all tests
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1
      }
    },
    include: [
      'tests/**/*.test.{js,mjs,jsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'backup'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'test/**',
        'backup/**',
        '**/*.d.ts'
      ],
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    },
    reporters: ['default'],
    outputFile: {
      json: './test-results.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@backend': path.resolve(__dirname, './src/backend'),
      '@frontend': path.resolve(__dirname, './src/frontend'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@tests': path.resolve(__dirname, './tests'),
      '@utils': path.resolve(__dirname, './src/backend/utils')
    }
  }
});
