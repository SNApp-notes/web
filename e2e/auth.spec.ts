import { test, expect } from '@playwright/test';
import { collectCoverage } from './helpers/coverage';
import { createTestUser, signOutUser, loginUser } from './helpers/auth';

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

test.describe('Sign In Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should successfully log in with valid credentials', async ({ page }) => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    };

    await createTestUser(page, testUser);
    await signOutUser(page);

    await loginUser(page, testUser.email, testUser.password);

    await expect(page).toHaveURL('/');

    await collectCoverage(page, 'login-valid');
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    const errorAlert = page.getByTestId('login-error');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/.*login/);

    await collectCoverage(page, 'login-not-valid');
  });

  test('should show error for wrong password', async ({ page }) => {
    const testUser = await createTestUser(page, {
      email: `test-${Date.now()}@example.com`,
      password: 'CorrectPassword123!',
      name: 'Test User'
    });

    await signOutUser(page);

    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    const errorAlert = page.getByTestId('login-error');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/.*login/);

    await collectCoverage(page, 'login-wrong-password');
  });
});

test.describe('Session Management', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should logout user and redirect to login', async ({ page }) => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    };

    await createTestUser(page, testUser);

    await expect(page).toHaveURL('/');

    await signOutUser(page);

    await expect(page).toHaveURL(/.*login/);

    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);

    await collectCoverage(page, 'logout');
  });

  test('should persist session across page refreshes', async ({ page }) => {
    await createTestUser(page, {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    });

    await expect(page).toHaveURL('/');

    await page.reload();

    await expect(page).toHaveURL('/');

    await collectCoverage(page, 'login-refresh');
  });
});

test.describe('Registration Validation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should validate email format during registration', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'TestPassword123!');

    await page.evaluate(() => {
      document.querySelector('form')?.setAttribute('noValidate', 'true');
    });

    await page.click('button[type="submit"]');

    await expect(page.getByText(/valid email|email.*invalid/i)).toBeVisible();

    await expect(page).toHaveURL(/.*register/);

    await collectCoverage(page, 'register-validation');
  });

  test('should validate password length requirement', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'short');

    await page.evaluate(() => {
      document.querySelector('form')?.setAttribute('noValidate', 'true');
    });

    await page.click('button[type="submit"]');

    await expect(page.getByText(/at least 8 characters|password.*8/i)).toBeVisible();
    await expect(page).toHaveURL(/.*register/);

    await collectCoverage(page, 'register-password-length');
  });

  test('should require all fields for registration', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');

    await page.evaluate(() => {
      document.querySelector('form')?.setAttribute('noValidate', 'true');
    });

    await page.click('button[type="submit"]');

    await expect(page.getByText('Name is required', { exact: true })).toBeVisible();

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', '');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText('Please enter a valid email address', { exact: true })
    ).toBeVisible();

    await collectCoverage(page, 'register-require-fields');
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    const email = `duplicate-${Date.now()}@example.com`;

    await createTestUser(page, {
      email,
      password: 'TestPassword123!',
      name: 'First User'
    });

    await signOutUser(page);

    await page.goto('/register');
    await page.fill('input[name="name"]', 'Second User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/already exists|already registered|email.*use/i)
    ).toBeVisible();
    await expect(page).toHaveURL(/.*register/);

    await collectCoverage(page, 'register-duplicate-email');
  });
});
