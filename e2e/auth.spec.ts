import { test, expect } from '@playwright/test';
import { collectCoverage } from './coverage-helper';

test.describe('Home Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/.*login/);
    await expect(page).toHaveTitle(/SNApp/);

    await collectCoverage(page, 'home-page-redirect');
  });
});

test.describe('Authentication', () => {
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

test.describe('Notes Application', () => {
  test.skip('should create a new note when authenticated', async ({ page }) => {
    await page.goto('/register');

    await page.getByPlaceholder('Full Name').fill('Test User');
    await page.getByPlaceholder('Email').fill('testuser@example.com');
    await page.getByPlaceholder(/password/i).fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await page.waitForURL('/');

    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await expect(newNoteButton).toBeVisible();

    await newNoteButton.click();

    const noteTitle = page.getByPlaceholder(/note title/i);
    await expect(noteTitle).toBeVisible();

    await collectCoverage(page, 'create-note-authenticated');
  });
});
