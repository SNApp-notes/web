import { test, expect } from '@playwright/test';
import { collectCoverage } from './coverage-helper';

test.describe('Notes Application', () => {
  test('should create a new note when authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-testid="note-list"]')).toBeVisible({
      timeout: 10000
    });

    // Count existing notes
    const initialNoteCount = await page.locator('.tree-node-label').count();

    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await expect(newNoteButton).toBeVisible();

    await newNoteButton.click();

    // Wait for a new note to appear
    await expect(page.locator('.tree-node-label')).toHaveCount(initialNoteCount + 1, {
      timeout: 10000
    });

    // Verify the new note exists with default name
    await expect(page.locator('[data-testid="note-list"]')).toContainText('New Note', {
      timeout: 5000
    });

    await collectCoverage(page, 'create-note-authenticated');
  });
});
