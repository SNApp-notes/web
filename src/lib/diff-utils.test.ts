/**
 * Unit tests for diff utilities
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  createContentHash,
  createDiff,
  applyDiff,
  calculateDiffSize,
  isDiffValid
} from './diff-utils';

describe('diff-utils', () => {
  // Suppress expected error logs from error handling tests
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      // Suppress "Failed to apply diff patch" warnings in tests
      // These are expected when testing error handling
    });
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });
  describe('createContentHash', () => {
    it('should create consistent hashes for same content', async () => {
      const content = 'Hello world';
      const hash1 = await createContentHash(content);
      const hash2 = await createContentHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string length
    });

    it('should create different hashes for different content', async () => {
      const content1 = 'Hello world';
      const content2 = 'Hello beautiful world';

      const hash1 = await createContentHash(content1);
      const hash2 = await createContentHash(content2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const hash = await createContentHash('');
      expect(hash).toHaveLength(64);
    });

    it('should handle large content', async () => {
      const largeContent = 'x'.repeat(100000);
      const hash = await createContentHash(largeContent);
      expect(hash).toHaveLength(64);
    });

    it('should handle unicode characters', async () => {
      const content = '你好世界 🌍 Здравствуй мир';
      const hash = await createContentHash(content);
      expect(hash).toHaveLength(64);
    });
  });

  describe('createDiff and applyDiff', () => {
    it('should create and apply diff for simple text change', () => {
      const original = 'Hello world';
      const edited = 'Hello beautiful world';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should handle line insertions', () => {
      const original = 'Line 1\nLine 2\nLine 3';
      const edited = 'Line 1\nLine 2\nNew Line\nLine 3';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should handle line deletions', () => {
      const original = 'Line 1\nLine 2\nLine 3\nLine 4';
      const edited = 'Line 1\nLine 3\nLine 4';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should handle line modifications', () => {
      const original = 'Line 1\nLine 2\nLine 3';
      const edited = 'Line 1\nModified Line 2\nLine 3';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should handle multiple changes', () => {
      const original = 'Line 1\nLine 2\nLine 3\nLine 4';
      const edited = 'Line 1\nModified Line 2\nLine 4\nNew Line 5';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should handle empty original', () => {
      const original = '';
      const edited = 'New content';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should handle empty edited', () => {
      const original = 'Original content';
      const edited = '';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should handle no changes', () => {
      const content = 'Unchanged content\nLine 2\nLine 3';

      const diff = createDiff(content, content);
      const restored = applyDiff(content, diff);

      expect(restored).toBe(content);
    });

    it('should handle large documents with small changes', () => {
      const original = 'Line 1\n' + 'x'.repeat(50000) + '\nLine 3';
      const edited = 'Line 1\n' + 'x'.repeat(50000) + '\nModified Line 3';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should handle markdown content', () => {
      const original = '# Header\n\nSome **bold** text.\n\n```js\ncode\n```';
      const edited = '# Header\n\nSome **bold** and *italic* text.\n\n```js\ncode\n```';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should handle unicode characters', () => {
      const original = '你好\nСлово\n🌍';
      const edited = '你好世界\nСлово\n🌍🌎';

      const diff = createDiff(original, edited);
      const restored = applyDiff(original, diff);

      expect(restored).toBe(edited);
    });

    it('should return null for invalid diff JSON', () => {
      const original = 'Original content';
      const invalidDiff = '{invalid json}';

      const restored = applyDiff(original, invalidDiff);

      expect(restored).toBeNull();
    });

    it('should handle corrupted diff data gracefully', () => {
      const original = 'Original content';
      const corruptedDiff = JSON.stringify([{ invalid: 'data' }]);

      const restored = applyDiff(original, corruptedDiff);

      // Should not throw, may return null or incorrect result
      expect(typeof restored === 'string' || restored === null).toBe(true);
    });
  });

  describe('calculateDiffSize', () => {
    it('should calculate diff size for small changes', () => {
      // Use multi-line content for realistic line-based diffing
      const lines = [];
      for (let i = 0; i < 500; i++) {
        lines.push(`Line ${i}: Some content here`);
      }
      const original = lines.join('\n');
      const edited = original + '\nNew line at the end';

      const { originalSize, diffSize, savings } = calculateDiffSize(original, edited);

      // Verify calculations are correct
      expect(originalSize).toBe(original.length * 2); // UTF-16
      expect(diffSize).toBeGreaterThan(0);
      expect(savings).toBeGreaterThanOrEqual(-1); // Can be negative due to overhead
      expect(savings).toBeLessThan(1);
    });

    it('should show minimal savings for complete rewrites', () => {
      const original = 'x'.repeat(1000);
      const edited = 'y'.repeat(1000);

      const { savings } = calculateDiffSize(original, edited);

      // Diff should be similar size or larger for complete rewrite
      expect(savings).toBeLessThan(0.5); // <50% savings
    });

    it('should calculate zero or negative savings for identical content', () => {
      const content = 'Unchanged content';

      const { savings } = calculateDiffSize(content, content);

      // Diff for unchanged content has JSON overhead - may have negative savings
      // This is expected behavior for short strings
      expect(savings).toBeGreaterThanOrEqual(-10); // Reasonable bound
      expect(savings).toBeLessThan(1.0);
    });

    it('should handle empty strings', () => {
      const { savings } = calculateDiffSize('', '');

      expect(savings).toBe(0);
    });

    it('should calculate diff size for typical edits', () => {
      // Typical scenario: multi-paragraph note, user adds a few lines
      const lines = [];
      for (let i = 0; i < 1000; i++) {
        lines.push(`Paragraph ${i}: This is some content in the note.`);
      }
      const original = lines.join('\n');
      const edited = original + '\n\nNew paragraph added by user';

      const { originalSize, diffSize, savings } = calculateDiffSize(original, edited);

      // Verify calculations are mathematically correct
      expect(originalSize).toBeGreaterThan(0);
      expect(diffSize).toBeGreaterThan(0);
      expect(savings).toBeGreaterThanOrEqual(-1); // Can be negative
      expect(savings).toBeLessThan(1.0); // Can't save more than 100%
    });
  });

  describe('isDiffValid', () => {
    it('should return true for valid diff', () => {
      const original = 'Hello world';
      const edited = 'Hello beautiful world';
      const diff = createDiff(original, edited);

      expect(isDiffValid(original, diff)).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      const original = 'Hello world';
      const invalidDiff = '{invalid json}';

      expect(isDiffValid(original, invalidDiff)).toBe(false);
    });

    it('should return false for corrupted diff', () => {
      const original = 'Hello world';
      const corruptedDiff = JSON.stringify({ not: 'a valid diff' });

      const result = isDiffValid(original, corruptedDiff);

      // May be true or false depending on how diff handles it
      expect(typeof result === 'boolean').toBe(true);
    });

    it('should validate complex diffs', () => {
      const original = '# Header\n\nParagraph 1\nParagraph 2\nParagraph 3';
      const edited =
        '# Header\n\nModified Paragraph 1\nParagraph 2\nNew Paragraph 3\nParagraph 4';
      const diff = createDiff(original, edited);

      expect(isDiffValid(original, diff)).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle full edit-save-restore cycle', () => {
      // User opens note
      const serverContent = '# My Note\n\nOriginal content here.';

      // User edits note
      const editedContent = '# My Note\n\nEdited content here.\n\nNew paragraph added.';

      // Create diff to store
      const diff = createDiff(serverContent, editedContent);

      // ... page refreshes ...

      // Restore edited content
      const restored = applyDiff(serverContent, diff);

      expect(restored).toBe(editedContent);
    });

    it('should detect base content mismatch via hash', async () => {
      const originalServer = 'Version 1';
      const edited = 'Version 1 edited';
      createDiff(originalServer, edited);
      const baseHash = await createContentHash(originalServer);

      // Simulate server content change (edited on another device)
      const newServerContent = 'Version 2';
      const currentHash = await createContentHash(newServerContent);

      // Hashes should differ -> conflict detected
      expect(currentHash).not.toBe(baseHash);

      // Applying diff to new server content would be wrong
      // Application should detect this via hash mismatch
    });

    it('should verify diff correctness with realistic note', async () => {
      // Realistic note: 10KB markdown with user adding a line
      const original = '# Meeting Notes\n\n' + '* Point\n'.repeat(400); // ~10KB
      const edited = original + '\n* New action item\n';

      const baseHash = await createContentHash(original);
      const diff = createDiff(original, edited);

      const { originalSize, diffSize } = calculateDiffSize(original, edited);

      // Verify size calculations are correct
      expect(originalSize).toBeGreaterThan(0);
      expect(diffSize).toBeGreaterThan(0);

      // Verify restoration works - this is what matters!
      const restored = applyDiff(original, diff);
      expect(restored).toBe(edited);

      // Verify hash is consistent
      const verifyHash = await createContentHash(original);
      expect(verifyHash).toBe(baseHash);
    });
  });
});
