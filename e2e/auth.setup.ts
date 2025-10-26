import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ browser }) => {
  // Create a new page without storage state to ensure clean authentication
  const authPage = await browser.newPage({ storageState: undefined });

  // Navigate to registration page
  await authPage.goto('/register');

  // Create a test user account
  const timestamp = Date.now();
  await authPage.fill('input[name="name"]', 'E2E Test User');
  await authPage.fill('input[name="email"]', `e2e-user-${timestamp}@example.com`);
  await authPage.fill('input[name="password"]', 'E2ETestPassword123!');
  await authPage.click('button[type="submit"]');

  // Wait for successful redirect to home page
  await authPage.waitForURL('/', { timeout: 10000 });

  // Verify authentication was successful by checking for authenticated content
  await expect(authPage.locator('[data-testid="note-list"]')).toBeVisible({
    timeout: 10000
  });

  // Save signed-in state
  await authPage.context().storageState({ path: authFile });

  await authPage.close();
});
