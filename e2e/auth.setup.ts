import { test as setup, expect } from 'playwright-test-coverage';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ browser }) => {
  // Create a new page without storage state to ensure clean authentication
  const authPage = await browser.newPage({ storageState: undefined });

  // Navigate to registration page with extended timeout for CI
  await authPage.goto('/register', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for page to be fully interactive (helps with React 19 hydration)
  await authPage.waitForLoadState('networkidle', { timeout: 15000 });

  // Create a test user account
  const timestamp = Date.now();
  await authPage.fill('input[name="name"]', 'E2E Test User');
  await authPage.fill('input[name="email"]', `e2e-user-${timestamp}@example.com`);
  await authPage.fill('input[name="password"]', 'E2ETestPassword123!');

  // Wait for button to be enabled before clicking (ensures form is ready)
  const submitButton = authPage.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled({ timeout: 10000 });

  await submitButton.click();

  // Wait for successful redirect away from register page with extended timeout
  await authPage.waitForURL((url) => !url.pathname.includes('/register'), {
    timeout: 15000
  });

  // Wait for post-registration redirects and hydration to complete
  await authPage.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await authPage.waitForLoadState('networkidle', { timeout: 15000 });

  // Verify authentication was successful by checking for authenticated content
  // Check for the "New Note" button which is only visible when authenticated
  await expect(authPage.getByRole('button', { name: /new note/i })).toBeVisible({
    timeout: 15000
  });

  // Save signed-in state
  await authPage.context().storageState({ path: authFile });

  await authPage.close();
});
