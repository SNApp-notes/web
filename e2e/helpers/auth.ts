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

  // Wait for session to be loaded and auth buttons to appear
  await page.waitForSelector('[data-testid="sign-out-button"]', { timeout: 10000 });

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

  // Wait for session to be loaded and auth buttons to appear
  await page.waitForSelector('[data-testid="sign-out-button"]', { timeout: 10000 });
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
  await page.getByTestId('sign-out-button').click();
  await page.waitForURL(/.*login/);
}
