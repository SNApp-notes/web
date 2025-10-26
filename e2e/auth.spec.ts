import { test, expect } from '@playwright/test';
import { collectCoverage } from './coverage-helper';

test.describe('Home Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/.*login/);
    await expect(page).toHaveTitle(/SNApp/);

    await collectCoverage(page, 'home-page-redirect');
  });
});

test.describe('Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should navigate to register page from login page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /create one/i }).click();

    await expect(page).toHaveURL(/.*register/);

    await collectCoverage(page, 'navigate-to-register');
  });

  test('should navigate to login page from register page', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('link', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/.*login/);

    await collectCoverage(page, 'navigate-to-login');
  });

  test('should show login form on login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    await collectCoverage(page, 'login-form-visibility');
  });

  test('should show register form on register page', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByPlaceholder('Full Name')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    await collectCoverage(page, 'register-form-visibility');
  });
});

test.describe('Welcome Note Creation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/register');
  });

  test('should create exactly one welcome note for new user on signup', async ({
    page
  }) => {
    const timestamp = Date.now();
    const email = `test-welcome-${timestamp}@example.com`;

    await page.fill('input[name="name"]', 'Welcome Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/', { timeout: 10000 });

    await page.waitForSelector('[data-testid="note-list"]', { timeout: 10000 });

    await page.waitForSelector('[data-testid="note-list"] .tree-item', {
      timeout: 10000
    });

    const noteItems = await page.locator('[data-testid="note-list"] .tree-item').all();

    expect(noteItems.length).toBe(1);

    const noteName = await noteItems[0].textContent();
    expect(noteName).toContain('Welcome');

    await collectCoverage(page, 'create-one-note');
  });

  test('should not create duplicate welcome notes on page refresh', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-no-dupe-${timestamp}@example.com`;

    await page.fill('input[name="name"]', 'No Dupe Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForSelector('[data-testid="note-list"] .tree-item', {
      timeout: 10000
    });

    const initialNotes = await page.locator('[data-testid="note-list"] .tree-item').all();

    expect(initialNotes.length).toBe(1);

    await page.reload();
    await page.waitForSelector('[data-testid="note-list"] .tree-item', {
      timeout: 10000
    });

    const notesAfterRefresh = await page
      .locator('[data-testid="note-list"] .tree-item')
      .all();

    expect(notesAfterRefresh.length).toBe(1);

    await page.reload();
    await page.waitForSelector('[data-testid="note-list"] .tree-item', {
      timeout: 10000
    });

    const notesAfterSecondRefresh = await page
      .locator('[data-testid="note-list"] .tree-item')
      .all();

    expect(notesAfterSecondRefresh.length).toBe(1);
    await collectCoverage(page, 'no-duplicated-note');
  });
});
