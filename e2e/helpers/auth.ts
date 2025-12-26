import { Page } from '@playwright/test';

export interface UserData {
  email: string;
  password: string;
  name: string;
}

export async function createTestUser(page: Page, userData: UserData): Promise<UserData> {
  await page.goto('/register');
  await page.fill('input[name="name"]', userData.name);
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');

  // Wait for page to be fully loaded (ensures React hydration completes)
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Wait for session to be loaded and auth buttons to appear
  // The useSession() hook makes a client-side API call to validate the session
  // Use retry logic for flaky session loading
  try {
    await page.waitForSelector('[data-testid="sign-out-button"]', { timeout: 20000 });
  } catch {
    // If sign-out button not found, reload and try again
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('[data-testid="sign-out-button"]', { timeout: 15000 });
  }

  return userData;
}

export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');

  // Wait for page to be fully loaded (ensures React hydration completes)
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Wait for session to be loaded and auth buttons to appear
  // The useSession() hook makes a client-side API call to validate the session
  // Use retry logic for flaky session loading
  try {
    await page.waitForSelector('[data-testid="sign-out-button"]', { timeout: 20000 });
  } catch {
    // If sign-out button not found, reload and try again
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('[data-testid="sign-out-button"]', { timeout: 15000 });
  }
}

export async function createAndLoginUser(page: Page): Promise<UserData> {
  const userData: UserData = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  };

  return createTestUser(page, userData);
}

export async function signOutUser(page: Page): Promise<void> {
  // Handle potential unsaved changes confirmation dialog
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  // Click logout and wait for navigation to complete
  // Use longer timeout and wait for load state to ensure sign-out completes
  await Promise.all([
    page.waitForURL(/.*login/, { timeout: 10000 }),
    page.getByTestId('sign-out-button').click()
  ]);

  // Wait for the login page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 5000 });

  // Verify we're actually on the login page by checking for sign-in button
  await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
}
