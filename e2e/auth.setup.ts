import { test as setup, expect } from 'playwright-test-coverage';
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

  // Wait for successful redirect away from register page
  await authPage.waitForURL((url) => !url.pathname.includes('/register'), {
    timeout: 5000
  });

  // Wait a bit for any post-registration redirects to complete
  await authPage.waitForLoadState('networkidle', { timeout: 5000 });

  // Verify authentication was successful by checking for authenticated content
  // Check for the "New Note" button which is only visible when authenticated
  await expect(authPage.getByRole('button', { name: /new note/i })).toBeVisible({
    timeout: 5000
  });

  // Save signed-in state
  await authPage.context().storageState({ path: authFile });

  await authPage.close();
});
