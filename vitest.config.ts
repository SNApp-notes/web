import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globalSetup: ['./src/test/global-setup.ts'],
    setupFiles: ['./src/test/setup.js', './src/test/setup-db.ts'],
    globals: true,
    css: true,
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    retry: process.env.CI ? 2 : 0,
    // Limit concurrent test files that access the database
    // This prevents "readonly database" errors from parallel access
    fileParallelism: false,
    env: {
      NODE_ENV: 'test'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json'],
      reportsDirectory: './coverage/unit',
      exclude: [
        'node_modules/',
        'src/test/',
        'src/components/ui/**/*',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
        '.next/',
        'build/',
        'dist/',
        'src/types/**',
        '**/*.test.*',
        '**/*.spec.*',
        'prisma-main/**/*',
        'prisma-e2e/**/*',
        'src/lib/parser/parser.js',
        'src/lib/email.ts'
      ],
      include: ['src/**/*.{ts,tsx}', '!src/test/**/*']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
