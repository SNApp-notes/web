/**
 * Unit tests for useUnsavedNotes hook
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnsavedNotes } from './useUnsavedNotes';
import * as localStorageModule from '@/lib/localStorage';
import * as diffUtilsModule from '@/lib/diff-utils';

// Mock dependencies
vi.mock('@/lib/localStorage');
vi.mock('@/lib/diff-utils');

const mockGetItem = vi.mocked(localStorageModule.getItem);
const mockSetItem = vi.mocked(localStorageModule.setItem);
const mockCreateContentHash = vi.mocked(diffUtilsModule.createContentHash);
const mockCreateDiff = vi.mocked(diffUtilsModule.createDiff);
const mockApplyDiff = vi.mocked(diffUtilsModule.applyDiff);

describe('useUnsavedNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementations
    mockGetItem.mockReturnValue(null);
    mockSetItem.mockReturnValue(true);
    mockCreateContentHash.mockResolvedValue('mock-hash-123');
    mockCreateDiff.mockReturnValue('mock-diff-data');
    mockApplyDiff.mockReturnValue('restored content');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('saveUnsavedNote', () => {
    it('should save unsaved note with debounce', async () => {
      const { result } = renderHook(() => useUnsavedNotes());

      const noteId = 1;
      const originalContent = 'Hello world';
      const editedContent = 'Hello world edited';

      act(() => {
        result.current.saveUnsavedNote(noteId, originalContent, editedContent);
      });

      // Should not save immediately
      expect(mockCreateDiff).not.toHaveBeenCalled();
      expect(mockSetItem).not.toHaveBeenCalled();

      // Fast-forward past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve(); // Allow promises to resolve
      });

      // Should save after debounce
      expect(mockCreateDiff).toHaveBeenCalledWith(originalContent, editedContent);
      expect(mockCreateContentHash).toHaveBeenCalledWith(originalContent);
      expect(mockSetItem).toHaveBeenCalledWith('unsavedNotes', {
        '1': {
          noteId: 1,
          baseHash: 'mock-hash-123',
          diff: 'mock-diff-data',
          timestamp: expect.any(Number)
        }
      });
    });

    it('should debounce multiple rapid saves', async () => {
      const { result } = renderHook(() => useUnsavedNotes());

      const noteId = 1;
      const originalContent = 'Hello';

      act(() => {
        result.current.saveUnsavedNote(noteId, originalContent, 'Hello 1');
        result.current.saveUnsavedNote(noteId, originalContent, 'Hello 2');
        result.current.saveUnsavedNote(noteId, originalContent, 'Hello 3');
      });

      // Fast-forward past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // Should only save once with the final content
      expect(mockCreateDiff).toHaveBeenCalledTimes(1);
      expect(mockCreateDiff).toHaveBeenCalledWith(originalContent, 'Hello 3');
    });

    it('should handle save errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateDiff.mockImplementation(() => {
        throw new Error('Diff creation failed');
      });

      const { result } = renderHook(() => useUnsavedNotes());

      act(() => {
        result.current.saveUnsavedNote(1, 'original', 'edited');
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save unsaved note 1:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple notes independently', async () => {
      let storedNotes: Record<string, unknown> = {};
      mockGetItem.mockImplementation(() => storedNotes);
      mockSetItem.mockImplementation((_key, value) => {
        storedNotes = value as Record<string, unknown>;
        return true;
      });

      const { result } = renderHook(() => useUnsavedNotes());

      act(() => {
        result.current.saveUnsavedNote(1, 'content1', 'edited1');
        result.current.saveUnsavedNote(2, 'content2', 'edited2');
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // Both notes should be saved (calls happen separately due to debouncing)
      expect(mockSetItem).toHaveBeenCalledTimes(2);
      expect(mockSetItem).toHaveBeenCalledWith(
        'unsavedNotes',
        expect.objectContaining({
          '1': expect.objectContaining({ noteId: 1 })
        })
      );
      expect(mockSetItem).toHaveBeenCalledWith(
        'unsavedNotes',
        expect.objectContaining({
          '2': expect.objectContaining({ noteId: 2 })
        })
      );
    });
  });

  describe('getUnsavedNote', () => {
    it('should return null when no unsaved note exists', async () => {
      mockGetItem.mockReturnValue(null);

      const { result } = renderHook(() => useUnsavedNotes());

      const restored = await result.current.getUnsavedNote(1, 'server content');

      expect(restored).toBeNull();
    });

    it('should restore unsaved note when base hash matches', async () => {
      const noteId = 1;
      const baseHash = 'hash-123';
      const diff = 'diff-data';

      mockGetItem.mockReturnValue({
        '1': { noteId, baseHash, diff, timestamp: Date.now() }
      });
      mockCreateContentHash.mockResolvedValue(baseHash); // Matching hash
      mockApplyDiff.mockReturnValue('restored content');

      const { result } = renderHook(() => useUnsavedNotes());

      const restored = await result.current.getUnsavedNote(noteId, 'server content');

      expect(restored).toBe('restored content');
      expect(mockCreateContentHash).toHaveBeenCalledWith('server content');
      expect(mockApplyDiff).toHaveBeenCalledWith('server content', diff);
    });

    it('should return null when base hash does not match (conflict)', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const noteId = 1;
      const storedHash = 'hash-old';
      const currentHash = 'hash-new';

      mockGetItem.mockReturnValue({
        '1': { noteId, baseHash: storedHash, diff: 'diff-data', timestamp: Date.now() }
      });
      mockCreateContentHash.mockResolvedValue(currentHash); // Mismatched hash

      const { result } = renderHook(() => useUnsavedNotes());

      const restored = await result.current.getUnsavedNote(noteId, 'server content');

      expect(restored).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Base content mismatch for note 1 - server content may have changed'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should clear invalid diff when apply fails', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const noteId = 1;
      const baseHash = 'hash-123';

      mockGetItem.mockReturnValue({
        '1': { noteId, baseHash, diff: 'invalid-diff', timestamp: Date.now() }
      });
      mockCreateContentHash.mockResolvedValue(baseHash);
      mockApplyDiff.mockReturnValue(null); // Apply failed

      const { result } = renderHook(() => useUnsavedNotes());

      const restored = await result.current.getUnsavedNote(noteId, 'server content');

      expect(restored).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to apply diff for note 1 - clearing invalid data'
      );
      expect(mockSetItem).toHaveBeenCalledWith('unsavedNotes', {}); // Cleared

      consoleWarnSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useUnsavedNotes());

      const restored = await result.current.getUnsavedNote(1, 'server content');

      expect(restored).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get unsaved note 1:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearUnsavedNote', () => {
    it('should clear unsaved note from storage', () => {
      mockGetItem.mockReturnValue({
        '1': { noteId: 1, baseHash: 'hash', diff: 'diff', timestamp: Date.now() },
        '2': { noteId: 2, baseHash: 'hash2', diff: 'diff2', timestamp: Date.now() }
      });

      const { result } = renderHook(() => useUnsavedNotes());

      act(() => {
        result.current.clearUnsavedNote(1);
      });

      expect(mockSetItem).toHaveBeenCalledWith('unsavedNotes', {
        '2': expect.objectContaining({ noteId: 2 })
      });
    });

    it('should clear pending debounce timer', async () => {
      const { result } = renderHook(() => useUnsavedNotes());

      act(() => {
        result.current.saveUnsavedNote(1, 'original', 'edited');
      });

      // Clear before debounce completes
      act(() => {
        result.current.clearUnsavedNote(1);
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // Should not have saved since timer was cleared
      expect(mockSetItem).not.toHaveBeenCalled();
    });

    it('should handle clearing non-existent note', () => {
      mockGetItem.mockReturnValue({});

      const { result } = renderHook(() => useUnsavedNotes());

      act(() => {
        result.current.clearUnsavedNote(999);
      });

      // Should not throw error
      expect(mockSetItem).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useUnsavedNotes());

      act(() => {
        result.current.clearUnsavedNote(1);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to clear unsaved note 1:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('hasUnsavedChanges', () => {
    it('should return true when note has unsaved changes', () => {
      mockGetItem.mockReturnValue({
        '1': { noteId: 1, baseHash: 'hash', diff: 'diff', timestamp: Date.now() }
      });

      const { result } = renderHook(() => useUnsavedNotes());

      const hasChanges = result.current.hasUnsavedChanges(1);

      expect(hasChanges).toBe(true);
    });

    it('should return false when note has no unsaved changes', () => {
      mockGetItem.mockReturnValue({});

      const { result } = renderHook(() => useUnsavedNotes());

      const hasChanges = result.current.hasUnsavedChanges(1);

      expect(hasChanges).toBe(false);
    });

    it('should return false when storage is empty', () => {
      mockGetItem.mockReturnValue(null);

      const { result } = renderHook(() => useUnsavedNotes());

      const hasChanges = result.current.hasUnsavedChanges(1);

      expect(hasChanges).toBe(false);
    });
  });

  describe('getAllUnsavedNoteIds', () => {
    it('should return all note IDs with unsaved changes', () => {
      mockGetItem.mockReturnValue({
        '1': { noteId: 1, baseHash: 'hash1', diff: 'diff1', timestamp: Date.now() },
        '5': { noteId: 5, baseHash: 'hash5', diff: 'diff5', timestamp: Date.now() },
        '10': { noteId: 10, baseHash: 'hash10', diff: 'diff10', timestamp: Date.now() }
      });

      const { result } = renderHook(() => useUnsavedNotes());

      const noteIds = result.current.getAllUnsavedNoteIds();

      expect(noteIds).toEqual([1, 5, 10]);
    });

    it('should return empty array when no unsaved notes exist', () => {
      mockGetItem.mockReturnValue(null);

      const { result } = renderHook(() => useUnsavedNotes());

      const noteIds = result.current.getAllUnsavedNoteIds();

      expect(noteIds).toEqual([]);
    });

    it('should return empty array when storage is empty object', () => {
      mockGetItem.mockReturnValue({});

      const { result } = renderHook(() => useUnsavedNotes());

      const noteIds = result.current.getAllUnsavedNoteIds();

      expect(noteIds).toEqual([]);
    });
  });
});
