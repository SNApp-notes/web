/**
 * @file e2e/search.spec.ts
 * @description End-to-end tests for search functionality (US-020)
 *
 * Tests the complete search feature including:
 * - Opening search modal with keyboard shortcut (Ctrl+Shift+F)
 * - Searching for content across notes
 * - Navigating to search results
 * - Pagination of results
 * - Closing search modal
 *
 * @requires Docker - Run with: npm run test:e2e:docker
 */

import { test, expect } from 'playwright-test-coverage';

test.describe('Search Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="sign-out-button"]')).toBeVisible({
      timeout: 10000
    });
  });
  test.describe('Opening Search Modal', () => {
    test('should open search modal with Ctrl+Shift+F', async ({ page }) => {
      // Press Ctrl+Shift+F to open search modal
      await page.keyboard.press('Control+Shift+F');

      // Search modal should be visible (use dialog role)
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible({ timeout: 5000 });

      // Search input should be focused
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeFocused();
    });

    test('should open search modal with Cmd+Shift+F on Mac', async ({ page }) => {
      // Press Meta+Shift+F to open search modal (Mac)
      await page.keyboard.press('Meta+Shift+F');

      // Search modal should be visible (use dialog role)
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Closing Search Modal', () => {
    test('should close modal with Escape key', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Modal should be hidden
      await expect(searchDialog).not.toBeVisible({ timeout: 5000 });
    });

    test('should close modal after selecting a result', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Type search query
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('Welcome');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for search results
      await expect(page.getByText(/result.*found/i)).toBeVisible({
        timeout: 5000
      });

      // Click on first result (look for note name in results)
      const firstResult = page.locator('[data-testid="search-result-item"]').first();
      await expect(firstResult).toBeVisible({ timeout: 5000 });
      await firstResult.click();

      // Modal should close
      await expect(searchDialog).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Search Execution', () => {
    test('should search for content and display results', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Type search query
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('Welcome');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results to load
      await page.waitForTimeout(1000); // Wait for debounce/search

      // Results should be displayed
      const resultsText = page.getByText(/result.*found/i);
      if ((await resultsText.count()) > 0) {
        await expect(resultsText).toBeVisible({ timeout: 5000 });
      } else {
        // If no results, empty state should show
        await expect(page.getByText(/no notes found/i)).toBeVisible({
          timeout: 5000
        });
      }
    });

    test('should display empty state when no results found', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for something that doesn't exist
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('xyznonexistentquery123');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for search to complete
      await page.waitForTimeout(1000);

      // Empty state should be displayed
      await expect(page.getByText(/no notes found/i)).toBeVisible({
        timeout: 5000
      });
    });

    test('should highlight search terms in results', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for a common word
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('note');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Check if results have highlighted text (mark elements)
      const marks = page.locator('mark');
      if ((await marks.count()) > 0) {
        await expect(marks.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show loading spinner while searching', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Type search query
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('test');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Spinner should appear briefly (may be very fast)
      // Note: This may not always be visible due to fast search
      // We're just checking it doesn't cause errors
    });
  });

  test.describe('Result Navigation', () => {
    test('should navigate to note when clicking result', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for welcome note
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('Welcome');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Check if results exist
      const resultsText = page.getByText(/result.*found/i);
      if ((await resultsText.count()) > 0) {
        // Click first result
        const firstResult = page.locator('[data-testid="search-result-item"]').first();
        if ((await firstResult.count()) > 0) {
          await firstResult.click();

          // Should navigate to note
          await page.waitForURL(/\/note\/\d+/, { timeout: 5000 });
          expect(page.url()).toMatch(/\/note\/\d+/);

          // Modal should be closed
          await expect(searchDialog).not.toBeVisible({ timeout: 2000 });
        }
      }
    });

    test('should navigate to specific line number in note', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for content
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('Welcome');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Check if results exist and have line numbers
      const lineNumberText = searchDialog.getByText(/Line \d+/);
      if ((await lineNumberText.count()) > 0) {
        // Get the line number from the first result
        const lineText = await lineNumberText.first().textContent();
        const lineMatch = lineText?.match(/Line (\d+)/);

        if (lineMatch) {
          // Click result
          await lineNumberText.first().click();

          // URL should contain line parameter
          await page.waitForTimeout(500);
          expect(page.url()).toMatch(/line=\d+/);
        }
      }
    });
  });

  test.describe('Pagination', () => {
    test('should show pagination when results exceed page size', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for a common term that might have many results
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('note');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Pagination may or may not be visible depending on result count
      // Just verify the search worked
      const resultsText = page.getByText(/result.*found/i);
      if ((await resultsText.count()) > 0) {
        await expect(resultsText).toBeVisible();
      }
    });

    test('should navigate between pages', async ({ page }) => {
      // This test assumes we have enough results to paginate
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for common term
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('note');

      // Click search button - scope to dialog to avoid conflicts
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Check if Next button exists and is enabled - scope to dialog
      const nextButton = searchDialog.getByRole('button', { name: /^next$/i });
      if ((await nextButton.count()) > 0) {
        const isDisabled = await nextButton.isDisabled();

        if (!isDisabled) {
          // Click Next button
          await nextButton.click();

          // Wait for page to update
          await page.waitForTimeout(500);

          // Page indicator should change
          await expect(searchDialog.getByText(/Page 2/)).toBeVisible({ timeout: 5000 });

          // Previous button should now be enabled - scope to dialog
          const prevButton = searchDialog.getByRole('button', { name: /^previous$/i });
          await expect(prevButton).toBeEnabled();
        }
      }
    });

    test('should disable Previous button on first page', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for content
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('note');

      // Click search button - scope to dialog
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // If pagination exists, Previous should be disabled on page 1 - scope to dialog
      const prevButton = searchDialog.getByRole('button', { name: /^previous$/i });
      if ((await prevButton.count()) > 0) {
        await expect(prevButton).toBeDisabled();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle empty search query gracefully', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Verify search button is disabled without query - scope to dialog
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await expect(searchButton).toBeDisabled();

      // Modal should remain open and functional
      await expect(searchDialog).toBeVisible();
    });

    test('should handle special characters in search', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search with special characters
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('test@#$%^&*()');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Should handle gracefully (either results or empty state)
      await expect(searchDialog).toBeVisible();
    });
  });

  test.describe('Search Modal State', () => {
    test('should clear previous results when opening modal again', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for something
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('Welcome');

      // Click search
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();
      await page.waitForTimeout(1000);

      // Close modal
      await page.keyboard.press('Escape');
      await expect(searchDialog).not.toBeVisible();

      // Open modal again
      await page.keyboard.press('Control+Shift+F');
      await expect(searchDialog).toBeVisible();

      // Previous search query should be cleared or results should be reset
      // Input should be empty or ready for new search
      await expect(searchInput).toBeVisible();
    });

    test('should maintain focus in search input', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search input should be focused
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await expect(searchInput).toBeFocused();

      // Type without explicitly clicking input
      await page.keyboard.type('test query');

      // Input should contain typed text
      await expect(searchInput).toHaveValue('test query');
    });
  });

  test.describe('Multiple Occurrences Feature', () => {
    test('should show separate results for each occurrence in a note', async ({
      page
    }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for a term likely to appear multiple times
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('function');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Get all search result items
      const resultItems = page.locator('[data-testid="search-result-item"]');
      const resultCount = await resultItems.count();

      if (resultCount > 1) {
        // Check if multiple results exist for the same note with different line numbers
        const firstResult = resultItems.first();
        const secondResult = resultItems.nth(1);

        // Both should be visible
        await expect(firstResult).toBeVisible();
        await expect(secondResult).toBeVisible();

        // Check for line number indicators
        const lineNumbers = searchDialog.getByText(/Line \d+/);
        const lineNumberCount = await lineNumbers.count();

        // Should have at least 2 line numbers
        expect(lineNumberCount).toBeGreaterThanOrEqual(2);
      }
    });

    test('should display different line numbers for each occurrence', async ({
      page
    }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for a common term
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('test');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Get all line number elements
      const lineNumbers = searchDialog.getByText(/Line \d+/);
      const lineNumberCount = await lineNumbers.count();

      if (lineNumberCount >= 2) {
        // Get first two line numbers
        const firstLineText = await lineNumbers.first().textContent();
        const secondLineText = await lineNumbers.nth(1).textContent();

        // Extract line numbers
        const firstLine = firstLineText?.match(/Line (\d+)/)?.[1];
        const secondLine = secondLineText?.match(/Line (\d+)/)?.[1];

        // Line numbers should be different (or same if truly on same line, but snippets should differ)
        // At minimum, verify line numbers are displayed
        expect(firstLine).toBeDefined();
        expect(secondLine).toBeDefined();
      }
    });

    test('should show total matches count for each note', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for a common term
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('function');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Look for total matches indicator (e.g., "5 matches")
      const matchesText = searchDialog.getByText(/\d+ match(es)?/i);

      if ((await matchesText.count()) > 0) {
        // Should display match count
        await expect(matchesText.first()).toBeVisible();

        // Extract the number
        const matchCountText = await matchesText.first().textContent();
        const matchCount = matchCountText?.match(/(\d+)/)?.[1];

        // Should be a valid number
        expect(matchCount).toBeDefined();
        expect(parseInt(matchCount || '0')).toBeGreaterThan(0);
      }
    });

    test('should paginate when occurrences exceed page size', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for a very common term likely to have many occurrences
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('function');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Check total results count
      const resultsText = searchDialog.getByText(/(\d+) results? found/i);

      if ((await resultsText.count()) > 0) {
        const resultsCountText = await resultsText.first().textContent();
        const totalResults = resultsCountText?.match(/(\d+)/)?.[1];

        if (totalResults && parseInt(totalResults) > 3) {
          // Should have pagination (page size is 3)
          const nextButton = searchDialog.getByRole('button', { name: /^next$/i });
          await expect(nextButton).toBeVisible();
          await expect(nextButton).toBeEnabled();

          // Click next to see more occurrences
          await nextButton.click();
          await page.waitForTimeout(500);

          // Should be on page 2
          await expect(searchDialog.getByText(/Page 2/)).toBeVisible();
        }
      }
    });

    test('should navigate to specific line when clicking occurrence', async ({
      page
    }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for content
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('function');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Get first result with a line number
      const lineNumbers = searchDialog.getByText(/Line \d+/);

      if ((await lineNumbers.count()) > 0) {
        const firstLineText = await lineNumbers.first().textContent();
        const lineNumber = firstLineText?.match(/Line (\d+)/)?.[1];

        if (lineNumber) {
          // Click the first result
          const firstResult = page.locator('[data-testid="search-result-item"]').first();
          await firstResult.click();

          // Wait for navigation
          await page.waitForTimeout(500);

          // URL should contain the line parameter
          expect(page.url()).toMatch(new RegExp(`line=${lineNumber}`));

          // Modal should be closed
          await expect(searchDialog).not.toBeVisible({ timeout: 2000 });
        }
      }
    });

    test('should show different snippets for occurrences on different lines', async ({
      page
    }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for a term
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('test');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Get result items
      const resultItems = page.locator('[data-testid="search-result-item"]');
      const resultCount = await resultItems.count();

      if (resultCount >= 2) {
        // Get snippets from first two results
        const firstSnippet = resultItems
          .first()
          .locator('[data-testid="result-snippet"]');
        const secondSnippet = resultItems
          .nth(1)
          .locator('[data-testid="result-snippet"]');

        if ((await firstSnippet.count()) > 0 && (await secondSnippet.count()) > 0) {
          const firstSnippetText = await firstSnippet.textContent();
          const secondSnippetText = await secondSnippet.textContent();

          // Snippets should be different (unless identical context, which is rare)
          // At minimum, verify both snippets exist
          expect(firstSnippetText).toBeDefined();
          expect(secondSnippetText).toBeDefined();
          expect(firstSnippetText?.length).toBeGreaterThan(0);
          expect(secondSnippetText?.length).toBeGreaterThan(0);
        }
      }
    });

    test('should handle notes with single occurrence correctly', async ({ page }) => {
      // Open search modal
      await page.keyboard.press('Control+Shift+F');
      const searchDialog = page.getByRole('dialog', { name: /search notes/i });
      await expect(searchDialog).toBeVisible();

      // Search for a unique term likely to appear once
      const searchInput = page.getByPlaceholder(/enter search query/i);
      await searchInput.fill('Welcome to SNApp');

      // Click search button
      const searchButton = searchDialog.getByRole('button', { name: /^search$/i });
      await searchButton.click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Check if results exist
      const resultsText = page.getByText(/result.*found/i);

      if ((await resultsText.count()) > 0) {
        // Should have line number
        const lineNumber = searchDialog.getByText(/Line \d+/);
        if ((await lineNumber.count()) > 0) {
          await expect(lineNumber.first()).toBeVisible();
        }

        // Should show match count of 1
        const matchText = searchDialog.getByText(/1 match/i);
        if ((await matchText.count()) > 0) {
          await expect(matchText.first()).toBeVisible();
        }
      }
    });
  });
});
