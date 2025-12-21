import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: process.env.CI ? 60000 : 30000, // Extended timeout for CI (60s vs 30s)
  reporter: [['list'], ['html', { outputFolder: 'report', open: 'never' }]],
  globalTeardown: require.resolve('./global-teardown.ts'),
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:45678',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    navigationTimeout: process.env.CI ? 30000 : 15000, // Extended navigation timeout for CI
    actionTimeout: process.env.CI ? 15000 : 10000 // Extended action timeout for CI
  },
  projects: [
    {
      name: 'setup auth',
      testMatch: /auth\.setup\.ts/
    },
    {
      name: 'chromium',
      testMatch: '*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '.auth', 'user.json')
      },
      dependencies: ['setup auth']
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
