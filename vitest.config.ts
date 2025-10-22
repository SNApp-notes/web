import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json'],
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
        '**/*.test.*',
        '**/*.spec.*'
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
