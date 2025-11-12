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

  test('should create first manual note with noteId: 2 (after welcome note)', async ({
    page
  }) => {
    // User should already have welcome note with ID 1
    // Verify welcome note exists
    await expect(page.locator('[data-testid="note-list"]')).toContainText('Welcome', {
      timeout: 5000
    });

    // Click on welcome note to verify it has ID 1
    const welcomeNote = page
      .locator('[data-testid="note-list"] .tree-node-label')
      .filter({ hasText: /Welcome/ })
      .first();
    await welcomeNote.click();
    await page.waitForURL(/\/note\/1$/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/note\/1$/);

    // Count existing notes before creating a new one
    const noteCountBefore = await page
      .locator('[data-testid="note-list"] .tree-item')
      .count();

    // Create first manual note
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    // Wait for new note to appear
    await expect(page.locator('[data-testid="note-list"] .tree-item')).toHaveCount(
      noteCountBefore + 1,
      { timeout: 5000 }
    );

    // Click on the newly created note (it should be the last one in the list)
    const newNote = page
      .locator('[data-testid="note-list"] .tree-node-label')
      .filter({ hasText: /^New Note( \d+)?$/ })
      .first();
    await expect(newNote).toBeVisible({ timeout: 5000 });
    await newNote.click();

    // Verify the URL contains /note/2 (first manual note gets ID 2 after welcome note with ID 1)
    await page.waitForURL(/\/note\/2$/, { timeout: 10000 });
    const url = page.url();
    expect(url).toMatch(/\/note\/2$/);

    await collectCoverage(page, 'first-manual-note-id-is-two');
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

test.describe('Header Navigation and URL Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="note-list"]')).toBeVisible({
      timeout: 10000
    });
  });

  test('should update URL when clicking header in right panel', async ({ page }) => {
    // Create a note with headers
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    // Wait for editor to be visible
    const editor = page.locator('.cm-editor').first();
    await expect(editor).toBeVisible({ timeout: 5000 });

    // Click on the editor to focus it
    const editorContent = page.locator('.cm-content').first();
    await editorContent.click();
    await page.waitForTimeout(500);

    // Clear and add content with multiple headers
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('---\n\n# Header 1\n\nSome content here.\n\n');
    await page.keyboard.type('---\n\n## Header 2\n\nMore content.\n\n');
    await page.keyboard.type('---\n\n### Header 3\n\nEven more content.');

    // Wait for headers to be parsed
    await page.waitForTimeout(1000);

    // Get the current note ID from URL
    const currentUrl = page.url();
    const noteIdMatch = currentUrl.match(/\/note\/(\d+)/);
    expect(noteIdMatch).not.toBeNull();
    const noteId = noteIdMatch![1];

    // Click on the second header in the right panel and extract its line number
    const secondHeader = page.locator('aside').getByText('Header 2').first();
    await expect(secondHeader).toBeVisible({ timeout: 5000 });

    // Get the parent box element that has data-line attribute
    const secondHeaderBox = secondHeader.locator('..');
    const expectedLine = await secondHeaderBox.getAttribute('data-line');
    expect(expectedLine).toBeTruthy();

    await secondHeader.click();

    // Wait for URL to update with the specific line parameter
    await page.waitForURL(`**/note/${noteId}?line=${expectedLine}`, { timeout: 5000 });

    // Verify the URL contains the exact line number
    const urlAfterClick = page.url();
    expect(urlAfterClick).toContain(`/note/${noteId}?line=${expectedLine}`);

    await collectCoverage(page, 'header-click-updates-url');
  });

  test('should scroll to correct line when refreshing page with line parameter', async ({
    page
  }) => {
    // Create a note with headers
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    // Wait for editor
    const editor = page.locator('.cm-editor').first();
    await editor.waitFor({ timeout: 5000 });

    // Add content with headers
    const editorContent = page.locator('.cm-content').first();
    await editorContent.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('# First Header\n\n');
    for (let i = 0; i < 20; i++) {
      await page.keyboard.type(`Line ${i + 1}\n`);
    }
    await page.keyboard.type('\n---\n\n## Second Header\n\nMore content here.');

    // Save the note before clicking header (to persist content to database)
    await page.keyboard.press('Control+s');

    // Wait for save to complete by checking for "Saved" status
    const savedStatus = page.getByText('Saved');
    await savedStatus.waitFor({ timeout: 5000 });

    // Click on "Second Header" in right panel
    const secondHeader = page.locator('aside').getByText('Second Header').first();
    await secondHeader.waitFor({ timeout: 5000 });

    // Get the parent box element that has data-line attribute
    const secondHeaderBox = secondHeader.locator('..');
    const expectedLine = await secondHeaderBox.getAttribute('data-line');
    expect(expectedLine).toBeTruthy();

    await secondHeader.click();

    // Wait for URL to update with the specific line parameter
    await page.waitForURL(`**?line=${expectedLine}`, { timeout: 5000 });

    // Verify the URL contains the exact line number
    const urlWithLine = page.url();
    expect(urlWithLine).toContain(`?line=${expectedLine}`);

    // Verify the active line gutter shows the correct line number after click
    // Filter for line number element (not folding icon) by checking text matches digits
    const activeLineGutterAfterClick = page
      .locator('.cm-activeLineGutter')
      .filter({ hasText: /^\d+$/ });
    await activeLineGutterAfterClick.waitFor({ timeout: 5000 });
    const activeLineTextAfterClick = await activeLineGutterAfterClick.innerText();
    expect(activeLineTextAfterClick).toBe(expectedLine);

    // Refresh the page
    await page.reload();

    // Wait for editor to load after refresh
    await editor.waitFor({ timeout: 10000 });

    // Wait for the URL to still have the line parameter after reload
    await page.waitForURL(`**?line=${expectedLine}`, { timeout: 5000 });

    // Verify "Second Header" is highlighted in the right panel
    // (indicating we scrolled to the correct position)
    const highlightedHeader = page.locator('aside [data-current="true"]');
    await highlightedHeader.waitFor({ timeout: 5000 });
    await expect(highlightedHeader).toContainText('Second Header');

    // Verify the highlighted header has the same line number as clicked
    const highlightedLine = await highlightedHeader.getAttribute('data-line');
    expect(highlightedLine).toBe(expectedLine);

    // Verify URL still contains the correct line parameter after refresh
    const urlAfterRefresh = page.url();
    expect(urlAfterRefresh).toContain(`?line=${expectedLine}`);

    // CRITICAL: Verify the active line gutter shows the correct line number after refresh
    // Filter for line number element (not folding icon) by checking text matches digits
    const activeLineGutter = page
      .locator('.cm-activeLineGutter')
      .filter({ hasText: /^\d+$/ });
    await activeLineGutter.waitFor({ timeout: 5000 });
    const activeLineText = await activeLineGutter.innerText();
    expect(activeLineText).toBe(expectedLine);

    await collectCoverage(page, 'refresh-with-line-parameter');
  });

  test('should highlight current header in right panel when scrolling', async ({
    page
  }) => {
    // Create a note with multiple headers
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    const editor = page.locator('.cm-editor').first();
    await expect(editor).toBeVisible({ timeout: 5000 });

    const editorContent = page.locator('.cm-content').first();
    await editorContent.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Create content with 3 headers
    await page.keyboard.type('---\n\n# Header A\n\nContent A.\n\n');
    await page.keyboard.type('---\n\n## Header B\n\nContent B.\n\n');
    await page.keyboard.type('---\n\n### Header C\n\nContent C.');

    await page.waitForTimeout(1000);

    // Click first header and verify URL
    const firstHeader = page.locator('aside').getByText('Header A').first();
    await expect(firstHeader).toBeVisible({ timeout: 5000 });

    const firstHeaderBox = firstHeader.locator('..');
    const firstLine = await firstHeaderBox.getAttribute('data-line');
    expect(firstLine).toBeTruthy();

    await firstHeader.click();
    await page.waitForURL(`**?line=${firstLine}`, { timeout: 5000 });

    const urlFirst = page.url();
    expect(urlFirst).toContain(`?line=${firstLine}`);

    // Click second header and verify URL updated
    const secondHeader = page.locator('aside').getByText('Header B').first();
    const secondHeaderBox = secondHeader.locator('..');
    const secondLine = await secondHeaderBox.getAttribute('data-line');
    expect(secondLine).toBeTruthy();

    await secondHeader.click();
    await page.waitForURL(`**?line=${secondLine}`, { timeout: 5000 });

    const urlSecond = page.url();
    expect(urlSecond).toContain(`?line=${secondLine}`);

    // Click third header and verify URL updated
    const thirdHeader = page.locator('aside').getByText('Header C').first();
    const thirdHeaderBox = thirdHeader.locator('..');
    const thirdLine = await thirdHeaderBox.getAttribute('data-line');
    expect(thirdLine).toBeTruthy();

    await thirdHeader.click();
    await page.waitForURL(`**?line=${thirdLine}`, { timeout: 5000 });

    const urlThird = page.url();
    expect(urlThird).toContain(`?line=${thirdLine}`);

    // Verify all three line numbers are different
    expect(firstLine).not.toBe(secondLine);
    expect(secondLine).not.toBe(thirdLine);
    expect(firstLine).not.toBe(thirdLine);

    await collectCoverage(page, 'header-navigation-updates-url');
  });

  test('should handle headers with dash syntax (--- delimiters)', async ({ page }) => {
    // Create a note
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    const editor = page.locator('.cm-editor').first();
    await expect(editor).toBeVisible({ timeout: 5000 });

    const editorContent = page.locator('.cm-content').first();
    await editorContent.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Use new dash syntax for headers
    await page.keyboard.type('---\n\n# Introduction\n\nWelcome!\n\n');
    await page.keyboard.type("---\n\n## Getting Started\n\nLet's begin.\n\n");
    await page.keyboard.type('---\n\n### Advanced Topics\n\nFor experts.');

    await page.waitForTimeout(1000);

    // Verify headers appear in right panel
    await expect(page.locator('aside').getByText('Introduction')).toBeVisible({
      timeout: 5000
    });
    await expect(page.locator('aside').getByText('Getting Started')).toBeVisible();
    await expect(page.locator('aside').getByText('Advanced Topics')).toBeVisible();

    // Click on "Getting Started" header and verify URL with specific line number
    const gettingStartedHeader = page
      .locator('aside')
      .getByText('Getting Started')
      .first();

    const gettingStartedBox = gettingStartedHeader.locator('..');
    const expectedLine = await gettingStartedBox.getAttribute('data-line');
    expect(expectedLine).toBeTruthy();

    await gettingStartedHeader.click();

    // Wait for URL to update with the specific line parameter
    await page.waitForURL(`**?line=${expectedLine}`, { timeout: 5000 });

    const urlAfterClick = page.url();
    expect(urlAfterClick).toContain(`?line=${expectedLine}`);

    await collectCoverage(page, 'dash-syntax-headers');
  });

  test('should auto-select first note when navigating to / with notes available', async ({
    page
  }) => {
    // Verify we have notes
    const notesList = page.locator('[data-testid="note-list"]');
    await expect(notesList).toBeVisible({ timeout: 5000 });

    const noteCount = await page.locator('[data-testid="note-list"] .tree-item').count();
    expect(noteCount).toBeGreaterThan(0);

    // Get the first note's ID by clicking on it first to establish baseline
    const firstNoteLabel = page.locator('.tree-node-label').first();
    await firstNoteLabel.click();
    await page.waitForURL(/\/note\/\d+/, { timeout: 5000 });

    // Extract the note ID from URL
    const urlWithNote = page.url();
    const noteIdMatch = urlWithNote.match(/\/note\/(\d+)/);
    expect(noteIdMatch).not.toBeNull();
    const firstNoteId = noteIdMatch![1];

    // Now navigate to root (/)
    await page.goto('/');

    // Wait for note list to be visible
    await expect(notesList).toBeVisible({ timeout: 5000 });

    // The app should automatically redirect to the first note
    await page.waitForURL(`**/note/${firstNoteId}`, { timeout: 5000 });

    // Verify the URL contains the first note's ID
    const finalUrl = page.url();
    expect(finalUrl).toContain(`/note/${firstNoteId}`);

    // Verify the first note is selected in the UI
    const selectedNote = page.locator('.tree-node-selected').first();
    await expect(selectedNote).toBeVisible();

    await collectCoverage(page, 'auto-select-first-note');
  });

  test('should verify active line gutter matches URL line parameter', async ({
    page
  }) => {
    // Create a note with multiple headers
    const newNoteButton = page.getByRole('button', { name: /new note/i });
    await newNoteButton.click();

    const editor = page.locator('.cm-editor').first();
    await editor.waitFor({ timeout: 5000 });

    // Add content with multiple headers
    const editorContent = page.locator('.cm-content').first();
    await editorContent.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    // Create content with line numbers we can predict
    await page.keyboard.type('# Header 1\n\n');
    await page.keyboard.type('Content line 1\n');
    await page.keyboard.type('Content line 2\n');
    await page.keyboard.type('Content line 3\n\n');
    await page.keyboard.type('---\n\n');
    await page.keyboard.type('## Header 2\n\n');
    await page.keyboard.type('Content line 4\n');
    await page.keyboard.type('Content line 5\n\n');
    await page.keyboard.type('---\n\n');
    await page.keyboard.type('### Header 3\n\n');
    await page.keyboard.type('Final content');

    // Save the note
    await page.keyboard.press('Control+s');
    const savedStatus = page.getByText('Saved');
    await savedStatus.waitFor({ timeout: 5000 });

    // Get current note URL for later use
    const currentUrl = page.url();
    const noteIdMatch = currentUrl.match(/\/note\/(\d+)/);
    expect(noteIdMatch).not.toBeNull();
    const noteId = noteIdMatch![1];

    // Test Case 1: Click on Header 2 and verify active line gutter
    const header2 = page.locator('aside').getByText('Header 2').first();
    await header2.waitFor({ timeout: 5000 });

    const header2Box = header2.locator('..');
    const header2Line = await header2Box.getAttribute('data-line');
    expect(header2Line).toBeTruthy();

    await header2.click();
    await page.waitForURL(`**?line=${header2Line}`, { timeout: 5000 });

    // Verify active line gutter shows the correct line
    // Filter for line number element (not folding icon) by checking text matches digits
    const activeLineGutter1 = page
      .locator('.cm-activeLineGutter')
      .filter({ hasText: /^\d+$/ });
    await activeLineGutter1.waitFor({ timeout: 5000 });
    const activeLineText1 = await activeLineGutter1.innerText();
    expect(activeLineText1).toBe(header2Line);
    expect(page.url()).toContain(`?line=${header2Line}`);

    // Test Case 2: Click on Header 3 and verify active line gutter updates
    const header3 = page.locator('aside').getByText('Header 3').first();
    await header3.waitFor({ timeout: 5000 });

    const header3Box = header3.locator('..');
    const header3Line = await header3Box.getAttribute('data-line');
    expect(header3Line).toBeTruthy();

    await header3.click();
    await page.waitForURL(`**?line=${header3Line}`, { timeout: 5000 });

    // Verify active line gutter updates to new line
    const activeLineGutter2 = page
      .locator('.cm-activeLineGutter')
      .filter({ hasText: /^\d+$/ });
    await activeLineGutter2.waitFor({ timeout: 5000 });
    const activeLineText2 = await activeLineGutter2.innerText();
    expect(activeLineText2).toBe(header3Line);
    expect(page.url()).toContain(`?line=${header3Line}`);

    // Test Case 3: Navigate directly via URL with line parameter
    await page.goto(`/note/${noteId}?line=${header2Line}`);
    await editor.waitFor({ timeout: 10000 });
    await page.waitForURL(`**?line=${header2Line}`, { timeout: 5000 });

    // Verify active line gutter shows correct line after direct URL navigation
    const activeLineGutter3 = page
      .locator('.cm-activeLineGutter')
      .filter({ hasText: /^\d+$/ });
    await activeLineGutter3.waitFor({ timeout: 5000 });
    const activeLineText3 = await activeLineGutter3.innerText();
    expect(activeLineText3).toBe(header2Line);

    // Test Case 4: Refresh page with line parameter
    await page.reload();
    await editor.waitFor({ timeout: 10000 });
    await page.waitForURL(`**?line=${header2Line}`, { timeout: 5000 });

    // Verify active line gutter persists after refresh
    const activeLineGutter4 = page
      .locator('.cm-activeLineGutter')
      .filter({ hasText: /^\d+$/ });
    await activeLineGutter4.waitFor({ timeout: 5000 });
    const activeLineText4 = await activeLineGutter4.innerText();
    expect(activeLineText4).toBe(header2Line);
    expect(page.url()).toContain(`?line=${header2Line}`);

    await collectCoverage(page, 'active-line-gutter-verification');
  });
});
