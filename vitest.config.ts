import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import coverageConfig from './coverage.config.js';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globalSetup: [path.resolve(__dirname, './src/test/global-setup.ts')],
    setupFiles: [
      path.resolve(__dirname, './src/test/setup.js'),
      path.resolve(__dirname, './src/test/setup-db.ts')
    ],
    globals: true,
    css: true,
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**', '**/prisma-7.0/**'],
    retry: process.env.CI ? 2 : 0,
    // Limit concurrent test files that access the database
    // This prevents "readonly database" errors from parallel access
    fileParallelism: false,
    env: {
      NODE_ENV: 'test'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],
      reportsDirectory: './coverage/unit',
      ...coverageConfig
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
