import { test, expect } from '@playwright/test';
import { collectCoverage } from './helpers/coverage';

test.describe('Notes Application - CRUD Operations', () => {
  // Clean up before each test by refreshing the page
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="note-list"]')).toBeVisible({
      timeout: 10000
    });
  });
  test('should create a new note when authenticated', async ({ page }) => {
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

  test('should rename a note via double-click and Enter key', async ({ page }) => {
    // Count initial notes
    const initialNoteCount = await page.locator('.tree-node-label').count();

    // Create a new note
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    // Wait for note count to increase
    await expect(page.locator('.tree-node-label')).toHaveCount(initialNoteCount + 1, {
      timeout: 5000
    });

    // Wait for any "New Note" to appear - use last() to get the most recently created
    const noteLabel = page
      .locator('.tree-node-label')
      .filter({ hasText: /^New Note( \d+)?$/ })
      .last();
    await expect(noteLabel).toBeVisible({ timeout: 5000 });

    // Get the actual note name (might be "New Note", "New Note 2", etc.)
    const originalNoteName = await noteLabel.textContent();

    // Double-click to enter edit mode - use more reliable approach
    await noteLabel.dblclick({ delay: 100 });

    // Wait for input field to appear and be focused
    const editInput = page.locator('.tree-node-input');
    await expect(editInput).toBeVisible({ timeout: 5000 });
    await expect(editInput).toBeFocused({ timeout: 2000 });
    await expect(editInput).toHaveValue(originalNoteName || '', { timeout: 2000 });

    // Clear and type new name
    await editInput.clear();
    await editInput.fill('My Renamed Note');

    // Press Enter to save
    await editInput.press('Enter');

    // Wait for input to disappear
    await expect(editInput).not.toBeVisible({ timeout: 2000 });

    // Verify the note has been renamed
    await expect(
      page.locator('.tree-node-label').filter({ hasText: 'My Renamed Note' })
    ).toBeVisible({ timeout: 5000 });

    await collectCoverage(page, 'rename-note-enter');
  });

  test('should rename a note via double-click and blur', async ({ page }) => {
    // Count initial notes
    const initialNoteCount = await page.locator('.tree-node-label').count();

    // Create a new note
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    // Wait for note count to increase
    await expect(page.locator('.tree-node-label')).toHaveCount(initialNoteCount + 1, {
      timeout: 5000
    });

    // Wait for any "New Note" to appear - use last() to get the most recently created
    const noteLabel = page
      .locator('.tree-node-label')
      .filter({ hasText: /^New Note( \d+)?$/ })
      .last();
    await expect(noteLabel).toBeVisible({ timeout: 5000 });

    // Get the actual note name
    const originalNoteName = await noteLabel.textContent();

    // Double-click to enter edit mode - use more reliable approach
    await noteLabel.dblclick({ delay: 100 });

    // Wait for input field to appear
    const editInput = page.locator('.tree-node-input');
    await expect(editInput).toBeVisible({ timeout: 5000 });
    await expect(editInput).toBeFocused({ timeout: 2000 });
    await expect(editInput).toHaveValue(originalNoteName || '', { timeout: 2000 });

    // Clear and type new name
    await editInput.clear();
    await editInput.fill('Note Renamed via Blur');

    // Click outside to blur and save
    await page.locator('[data-testid="note-list"]').click({ position: { x: 10, y: 10 } });

    // Wait for input to disappear
    await expect(editInput).not.toBeVisible({ timeout: 2000 });

    // Verify the note has been renamed
    await expect(
      page.locator('.tree-node-label').filter({ hasText: 'Note Renamed via Blur' })
    ).toBeVisible({ timeout: 5000 });

    await collectCoverage(page, 'rename-note-blur');
  });

  test('should cancel rename with Escape key', async ({ page }) => {
    // Count initial notes
    const initialNoteCount = await page.locator('.tree-node-label').count();

    // Create a new note
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    // Wait for new note count to increase
    await expect(page.locator('.tree-node-label')).toHaveCount(initialNoteCount + 1, {
      timeout: 5000
    });

    // Wait for any "New Note" to appear - use last() to get the most recently created
    const noteLabel = page
      .locator('.tree-node-label')
      .filter({ hasText: /^New Note( \d+)?$/ })
      .last();
    await expect(noteLabel).toBeVisible({ timeout: 5000 });

    // Get the actual note name
    const originalNoteName = await noteLabel.textContent();

    // Double-click to enter edit mode - use more reliable approach
    await noteLabel.dblclick({ delay: 100 });

    // Wait longer for input field to appear and verify it has correct value
    const editInput = page.locator('.tree-node-input');
    await expect(editInput).toBeVisible({ timeout: 5000 });
    await expect(editInput).toBeFocused({ timeout: 2000 });
    await expect(editInput).toHaveValue(originalNoteName || '', { timeout: 2000 });

    // Type new name but cancel
    await editInput.clear();
    await editInput.fill('This Should Not Be Saved');
    await editInput.press('Escape');

    // Wait for input to disappear
    await expect(editInput).not.toBeVisible({ timeout: 2000 });

    // Verify the note name was NOT changed (should still be original name)
    // Use regex with ^ and $ to match exact text to avoid partial matches
    const originalNoteRegex = new RegExp(
      `^${originalNoteName?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
    );
    await expect(
      page.locator('.tree-node-label').filter({ hasText: originalNoteRegex })
    ).toBeVisible({ timeout: 5000 });

    // Verify the new name does NOT exist
    await expect(
      page.locator('.tree-node-label').filter({ hasText: 'This Should Not Be Saved' })
    ).not.toBeVisible();

    await collectCoverage(page, 'cancel-rename-escape');
  });

  test('should create note, edit content, and save with Ctrl+S', async ({ page }) => {
    // Count initial notes to track the new one
    const initialNoteCount = await page.locator('.tree-node-label').count();

    // Create a new note
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    // Wait for note count to increase
    await expect(page.locator('.tree-node-label')).toHaveCount(initialNoteCount + 1, {
      timeout: 5000
    });

    // Wait for any "New Note" to appear and capture its actual name
    const noteLabel = page
      .locator('.tree-node-label')
      .filter({ hasText: /^New Note( \d+)?$/ })
      .last();
    await expect(noteLabel).toBeVisible({ timeout: 5000 });
    const noteName = await noteLabel.textContent();

    // Wait for the editor to be visible - use first() to avoid strict mode violations
    const editor = page.locator('.cm-editor').first();
    await expect(editor).toBeVisible({ timeout: 5000 });

    // Click on the editor content area to focus it
    const editorContent = page.locator('.cm-content').first();
    await editorContent.click();
    await page.waitForTimeout(500);

    // Clear any existing content first
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);

    // Type content into the editor
    await page.keyboard.type(
      '# My Test Note\n\nThis is some test content.\n\n- Item 1\n- Item 2'
    );

    // Wait for the content to be entered
    await page.waitForTimeout(500);

    // Verify unsaved changes indicator appears in top bar
    await expect(page.getByText('Unsaved changes')).toBeVisible({ timeout: 5000 });

    // Verify asterisk appears in the note name in sidebar
    const noteWithAsterisk = page
      .locator('.tree-node-label')
      .filter({ hasText: new RegExp(`^\\* ${noteName}$`) });
    await expect(noteWithAsterisk).toBeVisible({ timeout: 5000 });

    // Save with Ctrl+S - focus editor first
    await editorContent.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+s');

    // Wait for "Saving..." to appear
    await expect(page.getByText(/Saving\.\.\./)).toBeVisible({ timeout: 5000 });

    // Verify asterisk disappears after save completes (note is no longer dirty)
    await expect(noteWithAsterisk).not.toBeVisible({ timeout: 10000 });

    // Verify "Unsaved changes" label disappears from top bar
    await expect(page.getByText('Unsaved changes')).not.toBeVisible({ timeout: 5000 });

    // Refresh the page to verify content was saved
    await page.reload();

    // Wait for note list to load after refresh
    await expect(page.locator('[data-testid="note-list"]')).toBeVisible({
      timeout: 10000
    });

    // Select the note again using the captured name and click to load editor
    const reloadedNoteLabel = page
      .locator('.tree-node-label')
      .filter({ hasText: noteName || '' })
      .first();
    await expect(reloadedNoteLabel).toBeVisible({ timeout: 5000 });
    await reloadedNoteLabel.click();

    // Wait for navigation to complete to /note/[id] page
    await page.waitForURL(/\/note\/\d+/, { timeout: 10000 });

    // Wait for editor to load after navigation - use longer timeout
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Wait for content to load into editor
    await page.waitForTimeout(1000);

    // Verify the content was saved and persisted
    await expect(editor).toContainText('My Test Note', { timeout: 10000 });
    await expect(editor).toContainText('This is some test content', { timeout: 5000 });

    await collectCoverage(page, 'save-note-ctrl-s');
  });

  test('should show save status indicators correctly', async ({ page }) => {
    // Create a new note
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    // Wait for editor to be visible
    const editor = page.locator('.cm-editor');
    await expect(editor).toBeVisible({ timeout: 5000 });

    // Get the note name before editing
    const noteLabel = page
      .locator('.tree-node-label')
      .filter({ hasText: /^New Note( \d+)?$/ })
      .last();
    await expect(noteLabel).toBeVisible({ timeout: 5000 });
    const noteName = await noteLabel.textContent();

    // Click on the editor to focus it
    await editor.click();

    // Type content
    await page.keyboard.type('Testing save status');

    // Verify asterisk appears in note name (unsaved changes)
    const noteWithAsterisk = page
      .locator('.tree-node-label')
      .filter({ hasText: new RegExp(`^\\* ${noteName}$`) });
    await expect(noteWithAsterisk).toBeVisible({ timeout: 3000 });

    // Verify "Unsaved changes" appears in top bar
    await expect(page.getByText('Unsaved changes')).toBeVisible({ timeout: 3000 });

    // Trigger save
    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+s');
    } else {
      await page.keyboard.press('Control+s');
    }

    // Verify "Saving..." appears
    await expect(page.getByText('Saving...')).toBeVisible({ timeout: 3000 });

    // Verify asterisk disappears after save completes (note is clean)
    await expect(noteWithAsterisk).not.toBeVisible({ timeout: 5000 });

    // Verify "Unsaved changes" disappears from top bar
    await expect(page.getByText('Unsaved changes')).not.toBeVisible({ timeout: 5000 });

    await collectCoverage(page, 'save-status-indicators');
  });

  test('should complete full note workflow: create, rename, edit, save', async ({
    page
  }) => {
    // Count initial notes
    const initialNoteCount = await page.locator('.tree-node-label').count();

    // Step 1: Create a new note
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    // Wait for new note to appear
    await expect(page.locator('.tree-node-label')).toHaveCount(initialNoteCount + 1, {
      timeout: 5000
    });

    // Step 2: Rename the note - use last() to get the most recently created
    const noteLabel = page
      .locator('.tree-node-label')
      .filter({ hasText: /^New Note( \d+)?$/ })
      .last();
    await expect(noteLabel).toBeVisible({ timeout: 5000 });

    // Double-click with more reliable approach
    await noteLabel.dblclick({ delay: 100 });

    // Wait for edit mode with longer timeout
    const editInput = page.locator('.tree-node-input');
    await expect(editInput).toBeVisible({ timeout: 5000 });
    await expect(editInput).toBeFocused({ timeout: 2000 });

    // Clear and rename
    await editInput.clear();
    await editInput.fill('Complete Workflow Test');
    await editInput.press('Enter');

    // Wait for input to disappear (rename completed)
    await expect(editInput).not.toBeVisible({ timeout: 3000 });

    // Verify rename with longer timeout
    await expect(
      page.locator('.tree-node-label').filter({ hasText: 'Complete Workflow Test' })
    ).toBeVisible({ timeout: 5000 });

    // Step 3: Edit content - use first() to avoid strict mode violations
    const editor = page.locator('.cm-editor').first();
    await expect(editor).toBeVisible({ timeout: 5000 });

    // Click on the editor content area to focus it
    const editorContent = page.locator('.cm-content').first();
    await editorContent.click();
    await page.waitForTimeout(500);

    // Clear any existing content first
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);

    // Type content
    await page.keyboard.type('# Complete Workflow Test\n\n');
    await page.keyboard.type('This note demonstrates the complete workflow:\n\n');
    await page.keyboard.type('1. Created a new note\n');
    await page.keyboard.type('2. Renamed the note\n');
    await page.keyboard.type('3. Added content\n');
    await page.keyboard.type('4. Save the note\n');

    // Wait for content to be entered and state to update
    await page.waitForTimeout(800);

    // Verify unsaved changes indicator appears
    await expect(page.getByText('Unsaved changes')).toBeVisible({ timeout: 5000 });

    // Verify asterisk appears in note name
    const noteWithAsterisk = page
      .locator('.tree-node-label')
      .filter({ hasText: /^\* Complete Workflow Test$/ });
    await expect(noteWithAsterisk).toBeVisible({ timeout: 5000 });

    // Step 4: Save the note - focus editor again first
    await editorContent.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+s');

    // Wait for "Saving..." to appear
    await expect(page.getByText(/Saving\.\.\./)).toBeVisible({ timeout: 5000 });

    // Verify asterisk disappears after save completes
    await expect(noteWithAsterisk).not.toBeVisible({ timeout: 10000 });

    // Verify "Unsaved changes" disappears from top bar
    await expect(page.getByText('Unsaved changes')).not.toBeVisible({ timeout: 5000 });

    // Step 5: Verify persistence by refreshing
    await page.reload();

    await expect(page.locator('[data-testid="note-list"]')).toBeVisible({
      timeout: 10000
    });

    // Select the renamed note
    const renamedNote = page
      .locator('.tree-node-label')
      .filter({ hasText: 'Complete Workflow Test' })
      .first();
    await expect(renamedNote).toBeVisible({ timeout: 5000 });
    await renamedNote.click();

    // Wait for navigation to complete to /note/[id] page
    await page.waitForURL(/\/note\/\d+/, { timeout: 10000 });

    // Verify content persisted - wait for editor to load after navigation
    await expect(editor).toBeVisible({ timeout: 15000 });

    // Wait for content to load
    await page.waitForTimeout(1000);

    await expect(editor).toContainText('Complete Workflow Test', { timeout: 10000 });
    await expect(editor).toContainText('Created a new note', { timeout: 5000 });
    await expect(editor).toContainText('Renamed the note', { timeout: 5000 });
    await expect(editor).toContainText('Added content', { timeout: 5000 });
    await expect(editor).toContainText('Save the note', { timeout: 5000 });

    await collectCoverage(page, 'complete-note-workflow');
  });
});
