import { test, expect } from '@playwright/test';
import { collectCoverage } from './coverage-helper';

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
