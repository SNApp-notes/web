/**
 * Unit tests for localStorage utilities
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getItem,
  setItem,
  removeItem,
  clearAllSnappData,
  isLocalStorageAvailable,
  getStorageInfo,
  saveEditorState,
  getEditorState,
  clearEditorState
} from './localStorage';

describe('localStorage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Restore all mocks to ensure test isolation
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    // Restore all mocks to prevent pollution
    vi.restoreAllMocks();
  });

  describe('isLocalStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('should return false when localStorage is disabled', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage is disabled');
      });

      expect(isLocalStorageAvailable()).toBe(false);

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('setItem and getItem', () => {
    it('should store and retrieve string values', () => {
      const key = 'testKey';
      const value = 'test value';

      const success = setItem(key, value);
      expect(success).toBe(true);

      const retrieved = getItem<string>(key);
      expect(retrieved).toBe(value);
    });

    it('should store and retrieve object values', () => {
      const key = 'testObject';
      const value = {
        cursor: { line: 10, column: 5 },
        scroll: { top: 100, left: 0 }
      };

      const success = setItem(key, value);
      expect(success).toBe(true);

      const retrieved = getItem<typeof value>(key);
      expect(retrieved).toEqual(value);
    });

    it('should store and retrieve array values', () => {
      const key = 'testArray';
      const value = [1, 2, 3, 4, 5];

      const success = setItem(key, value);
      expect(success).toBe(true);

      const retrieved = getItem<number[]>(key);
      expect(retrieved).toEqual(value);
    });

    it('should store and retrieve number values', () => {
      const key = 'testNumber';
      const value = 42;

      const success = setItem(key, value);
      expect(success).toBe(true);

      const retrieved = getItem<number>(key);
      expect(retrieved).toBe(value);
    });

    it('should store and retrieve boolean values', () => {
      const key = 'testBoolean';
      const value = true;

      const success = setItem(key, value);
      expect(success).toBe(true);

      const retrieved = getItem<boolean>(key);
      expect(retrieved).toBe(value);
    });

    it('should return null for non-existent keys', () => {
      const retrieved = getItem<string>('nonExistent');
      expect(retrieved).toBeNull();
    });

    it('should use namespaced keys in localStorage', () => {
      const key = 'testKey';
      const value = 'test value';

      setItem(key, value);

      // Check that the key is namespaced
      const rawValue = localStorage.getItem('snapp:testKey');
      expect(rawValue).toBe(JSON.stringify(value));
    });

    it('should handle quota exceeded error gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalSetItem = Storage.prototype.setItem;
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation((key: string, value: string) => {
          // Allow availability check to succeed
          if (key === 'snapp:test') {
            originalSetItem.call(localStorage, key, value);
            return;
          }
          // Throw for actual test key
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        });

      const success = setItem('testKey', 'value');
      expect(success).toBe(false);
      expect(consoleWarn).toHaveBeenCalledWith(
        'localStorage quota exceeded',
        expect.any(DOMException)
      );

      consoleWarn.mockRestore();
      setItemSpy.mockRestore();
    });

    it('should handle JSON parse errors gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Directly set invalid JSON to localStorage bypassing our setItem function
      localStorage.setItem('snapp:invalidJson', '{invalid json}');

      const retrieved = getItem<object>('invalidJson');
      expect(retrieved).toBeNull();
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('should remove an existing item', () => {
      const key = 'testKey';
      const value = 'test value';

      const success = setItem(key, value);
      expect(success).toBe(true);
      expect(getItem<string>(key)).toBe(value);

      removeItem(key);
      expect(getItem<string>(key)).toBeNull();
    });

    it('should not throw error when removing non-existent key', () => {
      expect(() => removeItem('nonExistent')).not.toThrow();
    });

    it('should handle errors gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // First set an item so there's something to remove
      setItem('testKey', 'value');

      // Create mock that throws ONLY when called with the specific key
      const originalRemoveItem = Storage.prototype.removeItem;
      const removeItemSpy = vi
        .spyOn(Storage.prototype, 'removeItem')
        .mockImplementation((key: string) => {
          if (key === 'snapp:testKey') {
            throw new Error('removeItem failed');
          }
          // For other keys (like isLocalStorageAvailable test), use original
          originalRemoveItem.call(localStorage, key);
        });

      expect(() => removeItem('testKey')).not.toThrow();
      expect(consoleWarn).toHaveBeenCalledWith(
        'Failed to remove item from localStorage: testKey',
        expect.any(Error)
      );

      removeItemSpy.mockRestore();
      consoleWarn.mockRestore();
    });
  });

  describe('clearAllSnappData', () => {
    it('should clear only SNApp-namespaced data', () => {
      // Ensure localStorage is working properly
      localStorage.clear();

      // Set some SNApp data
      const success1 = setItem('editorState', { cursor: { line: 1, column: 0 } });
      const success2 = setItem('unsavedNotes', { 1: 'content' });
      expect(success1).toBe(true);
      expect(success2).toBe(true);

      // Set some non-SNApp data directly
      localStorage.setItem('otherApp:data', 'should remain');

      clearAllSnappData();

      // SNApp data should be cleared
      expect(getItem('editorState')).toBeNull();
      expect(getItem('unsavedNotes')).toBeNull();

      // Non-SNApp data should remain
      expect(localStorage.getItem('otherApp:data')).toBe('should remain');
    });

    it('should handle empty localStorage', () => {
      expect(() => clearAllSnappData()).not.toThrow();
    });

    it('should handle errors gracefully', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Set an item first
      setItem('testKey', 'value');

      // Create mock that throws ONLY when called with SNApp keys
      const originalRemoveItem = Storage.prototype.removeItem;
      const removeItemSpy = vi
        .spyOn(Storage.prototype, 'removeItem')
        .mockImplementation((key: string) => {
          if (key.startsWith('snapp:') && key !== 'snapp:test') {
            throw new Error('removeItem failed');
          }
          // For test keys (like isLocalStorageAvailable), use original
          originalRemoveItem.call(localStorage, key);
        });

      expect(() => clearAllSnappData()).not.toThrow();
      expect(consoleWarn).toHaveBeenCalledWith(
        'Failed to clear SNApp data from localStorage',
        expect.any(Error)
      );

      removeItemSpy.mockRestore();
      consoleWarn.mockRestore();
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage usage for SNApp data', async () => {
      localStorage.clear();
      const success1 = setItem('editorState', { cursor: { line: 10, column: 5 } });
      const success2 = setItem('unsavedNotes', { 1: 'content' });
      expect(success1).toBe(true);
      expect(success2).toBe(true);

      const info = await getStorageInfo();
      expect(info).not.toBeNull();
      expect(info!.used).toBeGreaterThan(0);
    });

    it('should return null when localStorage is unavailable', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });

      const info = await getStorageInfo();
      expect(info).toBeNull();

      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
    });

    it('should calculate approximate storage size correctly', async () => {
      localStorage.clear();
      const testData = { key: 'value', nested: { data: 'test' } };
      const success = setItem('testData', testData);
      expect(success).toBe(true);

      const info = await getStorageInfo();
      expect(info).not.toBeNull();

      // Storage should include the key and value
      // Approximate calculation: 'snapp:testData' + JSON.stringify(testData)
      const expectedMinSize =
        ('snapp:testData'.length + JSON.stringify(testData).length) * 2; // UTF-16

      expect(info!.used).toBeGreaterThanOrEqual(expectedMinSize - 10); // Allow small margin
    });

    it('should handle errors gracefully', async () => {
      localStorage.clear();
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock navigator.storage to throw error
      const originalEstimate = navigator.storage?.estimate;
      if (navigator.storage) {
        navigator.storage.estimate = vi
          .fn()
          .mockRejectedValue(new Error('estimate failed'));
      }

      const success = setItem('testData', 'value');
      expect(success).toBe(true);

      const info = await getStorageInfo();

      // Should still return usage even if estimate fails
      expect(info).not.toBeNull();
      expect(info!.used).toBeGreaterThan(0);

      if (navigator.storage && originalEstimate) {
        navigator.storage.estimate = originalEstimate;
      }
      consoleWarn.mockRestore();
    });
  });

  describe('saveEditorState and getEditorState', () => {
    it('should store and retrieve editor state with single key', () => {
      const state = {
        cursor: { line: 10, column: 5 },
        scrollAnchor: { from: 100, topOffset: 20, scrollLeft: 0 }
      };

      const success = saveEditorState(1, state);
      expect(success).toBe(true);

      const retrieved = getEditorState(1);
      expect(retrieved).toBeTruthy();
      expect(retrieved?.noteId).toBe(1);
      expect(retrieved?.cursor).toEqual(state.cursor);
      expect(retrieved?.scrollAnchor).toEqual(state.scrollAnchor);
      expect(retrieved?.timestamp).toBeGreaterThan(0);
    });

    it('should only store one editor state at a time', () => {
      // Save state for note 1
      saveEditorState(1, {
        cursor: { line: 1, column: 0 },
        scrollAnchor: { from: 0, topOffset: 0, scrollLeft: 0 }
      });

      // Save state for note 2 (should overwrite note 1's state)
      saveEditorState(2, {
        cursor: { line: 2, column: 5 },
        scrollAnchor: { from: 50, topOffset: 10, scrollLeft: 0 }
      });

      // Note 1's state should no longer be retrievable
      expect(getEditorState(1)).toBeNull();
      // Note 2's state should be available
      expect(getEditorState(2)).toBeTruthy();
      expect(getEditorState(2)?.cursor.line).toBe(2);
    });

    it('should return null when noteId does not match stored state', () => {
      saveEditorState(1, {
        cursor: { line: 1, column: 0 },
        scrollAnchor: { from: 0, topOffset: 0, scrollLeft: 0 }
      });

      // Trying to get state for a different note should return null
      expect(getEditorState(2)).toBeNull();
      expect(getEditorState(3)).toBeNull();
    });

    it('should return null when no state is stored', () => {
      expect(getEditorState(1)).toBeNull();
    });
  });

  describe('clearEditorState', () => {
    it('should clear the stored editor state', () => {
      saveEditorState(1, {
        cursor: { line: 10, column: 5 },
        scrollAnchor: { from: 100, topOffset: 20, scrollLeft: 0 }
      });

      expect(getEditorState(1)).toBeTruthy();

      clearEditorState();

      expect(getEditorState(1)).toBeNull();
    });

    it('should not throw when no state exists', () => {
      expect(() => clearEditorState()).not.toThrow();
    });

    it('should not affect other localStorage data', () => {
      saveEditorState(1, {
        cursor: { line: 1, column: 0 },
        scrollAnchor: { from: 0, topOffset: 0, scrollLeft: 0 }
      });
      localStorage.setItem(
        'snapp:unsavedNotes',
        JSON.stringify({ '1': { diff: 'test' } })
      );

      clearEditorState();

      expect(getEditorState(1)).toBeNull();
      expect(localStorage.getItem('snapp:unsavedNotes')).toBeTruthy();
    });
  });
});
