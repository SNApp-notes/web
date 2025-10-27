import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'report', open: 'never' }]],
  globalTeardown: require.resolve('./global-teardown.ts'),
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:45678',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '.auth', 'user.json')
      },
      dependencies: ['setup']
    }
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev -- --port 45678',
        url: 'http://localhost:45678',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000
      },
  outputDir: 'results'
});
