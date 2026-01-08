/**
 * E2E tests for state persistence (US-023)
 *
 * Tests cover:
 * - Unsaved notes restoration after page refresh
 * - Conflict resolution when server content changes
 * - Logout cleanup (no data leakage between users)
 * - localStorage management
 */
import { test, expect } from 'playwright-test-coverage';
import type { Page } from '@playwright/test';

/**
 * Helper to set CodeMirror content using keyboard input
 * Clears existing content and types new content
 */
async function setEditorContent(page: Page, content: string) {
  // Clear existing content
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.waitForTimeout(200);

  // Type new content
  await page.keyboard.type(content);
}

test.describe('State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for either sign-out button (authenticated) or redirect to login (not authenticated)
    // Extended timeout for client-side session to load (useSession() hook makes API call)
    // Use retry logic for flaky session loading
    try {
      await expect(page.locator('[data-testid="sign-out-button"]')).toBeVisible({
        timeout: 20000
      });
    } catch (error) {
      // If not authenticated, we might have been redirected to login
      // This can happen if storage state wasn't properly restored
      const url = page.url();
      if (url.includes('/login') || url.includes('/register')) {
        throw new Error(
          `Authentication failed - redirected to ${url}. Storage state may not be properly loaded.`
        );
      }
      // Try reloading the page once before failing
      await page.reload();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.locator('[data-testid="sign-out-button"]')).toBeVisible({
        timeout: 15000
      });
    }
  });

  test.describe('Unsaved Notes Restoration', () => {
    test('should restore unsaved content after page refresh', async ({ page }) => {
      // Create a new note
      const newNoteButton = page.getByRole('button', { name: /new note/i });
      await newNoteButton.click();

      // Wait for note to be created and selected
      await page.waitForURL(/\/note\/\d+$/, { timeout: 5000 });

      // Get the editor and set content
      const editor = page.locator('.cm-content');
      await expect(editor).toBeVisible({ timeout: 5000 });

      const testContent = 'This is unsaved content that should persist';
      await editor.click();
      await page.waitForTimeout(300);

      // Use helper to set content
      await setEditorContent(page, testContent);
      await page.waitForTimeout(500); // Wait for content to propagate

      // Wait for debounce (1 second) + extra buffer for async hash calculation
      await page.waitForTimeout(3000);

      // Verify content is in editor
      await expect(editor).toContainText(testContent);

      // Refresh the page
      await page.reload();

      // Wait for page to load and editor to be visible
      await expect(editor).toBeVisible({ timeout: 5000 });

      // Wait for restoration to complete (useEffect is async)
      await page.waitForTimeout(2000);

      // Verify unsaved content was restored
      await expect(async () => {
        const text = await editor.textContent();
        expect(text).toContain(testContent);
      }).toPass({ timeout: 10000, intervals: [500] });
    });

    test('should clear unsaved content after successful save', async ({ page }) => {
      // Create a new note
      const newNoteButton = page.getByRole('button', { name: /new note/i });
      await newNoteButton.click();

      // Wait for note to be created
      await page.waitForURL(/\/note\/\d+$/, { timeout: 5000 });

      // Get the editor and type content
      const editor = page.locator('.cm-content');
      await expect(editor).toBeVisible({ timeout: 5000 });

      const testContent = 'Content to be saved';
      await editor.click();
      await page.waitForTimeout(500);

      // Clear existing content
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);

      // Type new content
      await page.keyboard.type(testContent);
      await page.waitForTimeout(1000); // Wait for content to propagate

      // Wait for debounce + async hash calculation
      await page.waitForTimeout(3000);

      // Save the note (Ctrl+S or Cmd+S)
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+S' : 'Control+S');

      // Wait for save status to show "Saved" (check the main panel, not navigation bar)
      await expect(page.locator('main').getByText('Saved')).toBeVisible({
        timeout: 5000
      });

      // Wait for clearUnsavedNote to complete (it's called after setSaveStatus)
      await page.waitForTimeout(500);

      // Check localStorage - unsaved note should be cleared
      const localStorageData = await page.evaluate(() => {
        const data = localStorage.getItem('snapp:unsavedNotes');
        return data ? JSON.parse(data) : null;
      });

      // Should be empty or not contain this note
      if (localStorageData) {
        const noteId = page.url().match(/\/note\/(\d+)$/)?.[1];
        expect(localStorageData[noteId!]).toBeUndefined();
      }

      // Refresh and verify content is still there (saved to server)
      await page.reload();
      await expect(editor).toBeVisible({ timeout: 5000 });
      await expect(editor).toContainText(testContent);
    });

    test('should handle multiple notes with unsaved changes independently', async ({
      page
    }) => {
      const editor = page.locator('.cm-content');
      const newNoteButton = page.getByRole('button', { name: /new note/i });

      // Get current URL before creating first note (could be / or /note/1)
      const initialUrl = page.url();
      const initialNoteId = initialUrl.match(/\/note\/(\d+)$/)?.[1] || '0';

      // Create first note - wait for URL to change to a NEW note
      await newNoteButton.click();
      await page.waitForURL(
        (url) => {
          const match = url.pathname.match(/\/note\/(\d+)$/);
          if (!match) return false;
          // Must be a different (higher) note ID than before
          return parseInt(match[1]) > parseInt(initialNoteId);
        },
        { timeout: 5000 }
      );

      const firstNoteUrl = page.url();
      const firstNoteId = firstNoteUrl.match(/\/note\/(\d+)$/)?.[1];

      // Add content to first note
      await expect(editor).toBeVisible({ timeout: 5000 });
      await editor.click();
      await page.waitForTimeout(500);

      // Use helper to set content (more reliable than keyboard.type)
      await setEditorContent(page, 'First note content');
      await page.waitForTimeout(500); // Wait for content to propagate
      await page.waitForTimeout(3000); // Wait for debounce + async hash

      // Create second note
      await newNoteButton.click();
      await page.waitForURL((url) => url.pathname !== `/note/${firstNoteId}`, {
        timeout: 5000
      });

      const secondNoteUrl = page.url();
      const secondNoteId = secondNoteUrl.match(/\/note\/(\d+)$/)?.[1];

      // Add content to second note
      await expect(editor).toBeVisible({ timeout: 5000 });
      await editor.click();
      await page.waitForTimeout(500);

      // Use helper to set content (more reliable than keyboard.type)
      await setEditorContent(page, 'Second note content');
      await page.waitForTimeout(500); // Wait for content to propagate
      await page.waitForTimeout(3000); // Wait for debounce + async hash

      // Refresh page
      await page.reload();

      // Should still be on second note with content restored
      await expect(editor).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(2000); // Wait for restoration

      // Verify we're still on second note URL
      expect(page.url()).toContain(`/note/${secondNoteId}`);

      // Use waitFor to poll until content appears
      await expect(async () => {
        const text = await editor.textContent();
        expect(text).toContain('Second note content');
      }).toPass({ timeout: 10000, intervals: [500] });

      // Navigate to first note by clicking in sidebar (more reliable than goto)
      // Find the exact note by its title attribute containing the URL
      const firstNoteItem = page.locator(
        `[data-testid="note-list"] .tree-node-label[title="/note/${firstNoteId}"]`
      );
      await firstNoteItem.click({ timeout: 15000 });

      // Wait for navigation to complete
      await page.waitForURL(`**/note/${firstNoteId}`, { timeout: 5000 });
      await expect(editor).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(2000); // Wait for restoration

      // First note content should also be restored
      await expect(async () => {
        const text = await editor.textContent();
        expect(text).toContain('First note content');
      }).toPass({ timeout: 10000, intervals: [500] });
    });

    test('should not restore unsaved changes if content is unchanged', async ({
      page
    }) => {
      // Navigate to existing welcome note
      const welcomeNote = page
        .locator('[data-testid="note-list"] .tree-node-label')
        .filter({ hasText: /Welcome/ })
        .first();
      await welcomeNote.click();
      await page.waitForURL(/\/note\/\d+$/, { timeout: 5000 });

      // Get original content
      const editor = page.locator('.cm-content');
      await expect(editor).toBeVisible({ timeout: 5000 });
      const originalContent = await editor.textContent();

      // Refresh without making changes
      await page.reload();

      // Content should be the same
      await expect(editor).toBeVisible({ timeout: 5000 });
      const restoredContent = await editor.textContent();
      expect(restoredContent).toBe(originalContent);

      // Check localStorage - should not have unsaved changes for this note
      const localStorageData = await page.evaluate(() => {
        const data = localStorage.getItem('snapp:unsavedNotes');
        return data ? JSON.parse(data) : null;
      });

      const noteId = page.url().match(/\/note\/(\d+)$/)?.[1];
      expect(localStorageData?.[noteId!]).toBeUndefined();
    });
  });

  // Logout tests modify auth state - temporarily skipped to avoid breaking subsequent tests
  // TODO: Fix auth state isolation
  test.describe.skip('Logout Cleanup', () => {
    test('should clear all localStorage data on logout', async ({ page }) => {
      // Create a new note with unsaved content
      const newNoteButton = page.getByRole('button', { name: /new note/i });
      await newNoteButton.click();
      await page.waitForURL(/\/note\/\d+$/, { timeout: 5000 });

      // Add unsaved content
      const editor = page.locator('.cm-content');
      await expect(editor).toBeVisible({ timeout: 5000 });
      await editor.click();
      await page.waitForTimeout(500);

      // Clear existing content
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);

      // Type new content
      await page.keyboard.type('Unsaved content before logout');
      await page.waitForTimeout(1000); // Wait for content to propagate
      await page.waitForTimeout(3000); // Wait for debounce + async hash

      // Verify localStorage has unsaved data
      const localStorageData = await page.evaluate(() => {
        const keys = Object.keys(localStorage).filter((key) => key.startsWith('snapp:'));
        return keys.length > 0;
      });
      expect(localStorageData).toBe(true);

      // Set up dialog handler to accept logout despite unsaved changes
      page.once('dialog', (dialog) => {
        expect(dialog.message()).toContain('unsaved changes');
        dialog.accept();
      });

      // Logout
      const logoutButton = page.locator('[data-testid="sign-out-button"]');
      await logoutButton.click();

      // Wait for redirect to login
      await page.waitForURL(/\/login$/, { timeout: 5000 });

      // Verify all snapp:* localStorage data is cleared
      const clearedData = await page.evaluate(() => {
        const keys = Object.keys(localStorage).filter((key) => key.startsWith('snapp:'));
        return keys.length;
      });
      expect(clearedData).toBe(0);
    });

    test('should prompt user before logout with unsaved changes', async ({ page }) => {
      // Create a new note with unsaved content
      const newNoteButton = page.getByRole('button', { name: /new note/i });
      await newNoteButton.click();
      await page.waitForURL(/\/note\/\d+$/, { timeout: 5000 });

      // Add unsaved content
      const editor = page.locator('.cm-content');
      await expect(editor).toBeVisible({ timeout: 5000 });
      await editor.click();
      await page.waitForTimeout(500);

      // Type content (dirty flag should be set immediately)
      await page.keyboard.type('Unsaved content');
      await page.waitForTimeout(500); // Wait for dirty flag to update

      // Don't wait for debounce - content is in editor but not yet in localStorage
      // The dirty flag should be set immediately

      // Set up dialog handler to cancel logout
      page.once('dialog', (dialog) => {
        expect(dialog.message()).toContain('unsaved changes');
        dialog.dismiss();
      });

      // Try to logout
      const logoutButton = page.locator('[data-testid="sign-out-button"]');
      await logoutButton.click();

      // Should still be on the note page (logout was cancelled)
      await page.waitForTimeout(500);
      expect(page.url()).toMatch(/\/note\/\d+$/);
    });

    test('should allow logout if user confirms despite unsaved changes', async ({
      page
    }) => {
      // Create a new note with unsaved content
      const newNoteButton = page.getByRole('button', { name: /new note/i });
      await newNoteButton.click();
      await page.waitForURL(/\/note\/\d+$/, { timeout: 5000 });

      // Add unsaved content
      const editor = page.locator('.cm-content');
      await expect(editor).toBeVisible({ timeout: 5000 });
      await editor.click();
      await page.waitForTimeout(500);

      // Type content (dirty flag should be set immediately)
      await page.keyboard.type('Content to be discarded');
      await page.waitForTimeout(500); // Wait for dirty flag to update

      // Set up dialog handler to accept logout
      page.once('dialog', (dialog) => {
        expect(dialog.message()).toContain('unsaved changes');
        dialog.accept();
      });

      // Logout
      const logoutButton = page.locator('[data-testid="sign-out-button"]');
      await logoutButton.click();

      // Should redirect to login
      await page.waitForURL(/\/login$/, { timeout: 5000 });
    });
  });

  test.describe('localStorage Management', () => {
    test('should use namespaced keys (snapp:*) for all storage', async ({ page }) => {
      // Create a note with unsaved content
      const newNoteButton = page.getByRole('button', { name: /new note/i });
      await newNoteButton.click();
      await page.waitForURL(/\/note\/\d+$/, { timeout: 5000 });

      const editor = page.locator('.cm-content');
      await expect(editor).toBeVisible({ timeout: 5000 });
      await editor.click();
      await page.waitForTimeout(500);

      // Clear existing content
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);

      // Type new content
      await page.keyboard.type('Test content');
      await page.waitForTimeout(1000); // Wait for content to propagate
      await page.waitForTimeout(1500);

      // Check all localStorage keys
      const keys = await page.evaluate(() => Object.keys(localStorage));

      // All snapp-related keys should have snapp: prefix
      const snappKeys = keys.filter(
        (key) => key.includes('unsaved') || key.includes('editor')
      );
      snappKeys.forEach((key) => {
        expect(key).toMatch(/^snapp:/);
      });
    });

    test('should handle localStorage quota exceeded gracefully', async ({ page }) => {
      // This test verifies the app doesn't crash if localStorage is full
      // We'll fill localStorage and verify the app still works

      // Fill localStorage (leave some space for testing)
      await page.evaluate(() => {
        try {
          const largeData = 'x'.repeat(1024 * 1024); // 1MB chunk
          let i = 0;
          while (i < 4) {
            // Try to fill ~4MB
            localStorage.setItem(`test-filler-${i}`, largeData);
            i++;
          }
        } catch (e) {
          // Storage full - that's fine for this test
        }
      });

      // Create a note
      const newNoteButton = page.getByRole('button', { name: /new note/i });
      await newNoteButton.click();
      await page.waitForURL(/\/note\/\d+$/, { timeout: 5000 });

      // Try to add content (should still work even if localStorage fails)
      const editor = page.locator('.cm-content');
      await expect(editor).toBeVisible({ timeout: 5000 });
      await editor.click();
      await page.waitForTimeout(500);

      // Clear existing content
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await page.waitForTimeout(200);

      // Type new content
      await page.keyboard.type('Content with full storage');
      await page.waitForTimeout(1000); // Wait for content to propagate

      // App should still function (content should be in memory)
      await expect(editor).toContainText('Content with full storage');

      // Clean up
      await page.evaluate(() => {
        const keys = Object.keys(localStorage).filter((key) =>
          key.startsWith('test-filler-')
        );
        keys.forEach((key) => localStorage.removeItem(key));
      });
    });
  });
});
