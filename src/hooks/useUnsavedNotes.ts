/**
 * @module hooks/useUnsavedNotes
 * @description Hook for managing diff-based unsaved note content in localStorage.
 *
 * @remarks
 * **Purpose:**
 * - Store unsaved note changes as diffs (not full content) for efficient storage
 * - Detect conflicts when server content changes
 * - Restore unsaved changes after page refresh
 * - Clear diffs after successful save
 *
 * **Storage Strategy:**
 * - Uses diff-based storage (90-95% space savings vs full content)
 * - Stores base content hash to detect server-side changes
 * - Debounced saves to localStorage (1 second delay)
 *
 * **Usage:**
 * ```typescript
 * const {
 *   saveUnsavedNote,
 *   getUnsavedNote,
 *   clearUnsavedNote,
 *   hasUnsavedChanges
 * } = useUnsavedNotes();
 *
 * // User edits note
 * saveUnsavedNote(noteId, serverContent, editedContent);
 *
 * // Page refreshes - restore unsaved changes
 * const restored = getUnsavedNote(noteId, currentServerContent);
 * if (restored) {
 *   // Apply restored content
 * }
 *
 * // User saves note
 * clearUnsavedNote(noteId);
 * ```
 */
'use client';

import { useCallback, useRef } from 'react';
import { getItem, setItem } from '@/lib/localStorage';
import { createContentHash, createDiff, applyDiff } from '@/lib/diff-utils';
import type { UnsavedNoteDiff } from '@/lib/diff-utils';

/**
 * Storage key for unsaved notes map in localStorage.
 */
const UNSAVED_NOTES_KEY = 'unsavedNotes';

/**
 * Debounce delay for saving unsaved notes (1 second).
 */
const SAVE_DEBOUNCE_DELAY = 1000;

/**
 * Hook return type.
 */
interface UseUnsavedNotesReturn {
  saveUnsavedNote: (
    noteId: number,
    originalContent: string,
    editedContent: string
  ) => void;
  getUnsavedNote: (
    noteId: number,
    currentServerContent: string
  ) => Promise<string | null>;
  clearUnsavedNote: (noteId: number) => void;
  hasUnsavedChanges: (noteId: number) => boolean;
  getAllUnsavedNoteIds: () => number[];
}

/**
 * Hook for managing diff-based unsaved note content.
 *
 * @returns {UseUnsavedNotesReturn} Unsaved notes management functions
 *
 * @example
 * ```typescript
 * function NoteEditor({ noteId, serverContent }) {
 *   const { saveUnsavedNote, getUnsavedNote, clearUnsavedNote } = useUnsavedNotes();
 *   const [content, setContent] = useState(serverContent);
 *
 *   // Restore unsaved changes on mount
 *   useEffect(() => {
 *     const restored = await getUnsavedNote(noteId, serverContent);
 *     if (restored) {
 *       setContent(restored);
 *     }
 *   }, [noteId]);
 *
 *   // Save unsaved changes on edit
 *   const handleChange = (newContent) => {
 *     setContent(newContent);
 *     saveUnsavedNote(noteId, serverContent, newContent);
 *   };
 *
 *   // Clear unsaved changes on save
 *   const handleSave = async () => {
 *     await saveToServer(content);
 *     clearUnsavedNote(noteId);
 *   };
 * }
 * ```
 */
export function useUnsavedNotes(): UseUnsavedNotesReturn {
  // Debounce timers for each note
  const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  /**
   * Get all unsaved notes from localStorage.
   */
  const getUnsavedNotesMap = useCallback((): Map<number, UnsavedNoteDiff> => {
    const stored = getItem<Record<string, UnsavedNoteDiff>>(UNSAVED_NOTES_KEY);
    if (!stored) {
      return new Map();
    }

    // Convert object to Map with number keys
    const map = new Map<number, UnsavedNoteDiff>();
    Object.entries(stored).forEach(([key, value]) => {
      map.set(parseInt(key, 10), value);
    });
    return map;
  }, []);

  /**
   * Save unsaved notes map to localStorage.
   */
  const saveUnsavedNotesMap = useCallback((map: Map<number, UnsavedNoteDiff>): void => {
    // Convert Map to object for JSON serialization
    const obj: Record<string, UnsavedNoteDiff> = {};
    map.forEach((value, key) => {
      obj[key.toString()] = value;
    });
    setItem(UNSAVED_NOTES_KEY, obj);
  }, []);

  /**
   * Save unsaved note with diff-based storage (debounced).
   *
   * @param {number} noteId - Note identifier
   * @param {string} originalContent - Original content from server
   * @param {string} editedContent - Edited content by user
   */
  const saveUnsavedNote = useCallback(
    (noteId: number, originalContent: string, editedContent: string): void => {
      // Clear existing timer for this note
      const existingTimer = debounceTimers.current.get(noteId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Debounce the save operation
      const timer = setTimeout(async () => {
        try {
          // Create diff and hash
          const diff = createDiff(originalContent, editedContent);
          const baseHash = await createContentHash(originalContent);

          // Get current map
          const map = getUnsavedNotesMap();

          // Add/update entry
          map.set(noteId, {
            noteId,
            baseHash,
            diff,
            timestamp: Date.now()
          });

          // Save to localStorage
          saveUnsavedNotesMap(map);

          debounceTimers.current.delete(noteId);
        } catch (error) {
          console.error(`Failed to save unsaved note ${noteId}:`, error);
        }
      }, SAVE_DEBOUNCE_DELAY);

      debounceTimers.current.set(noteId, timer);
    },
    [getUnsavedNotesMap, saveUnsavedNotesMap]
  );

  /**
   * Get unsaved note and apply diff to current server content.
   *
   * @param {number} noteId - Note identifier
   * @param {string} currentServerContent - Current content from server
   * @returns {Promise<string | null>} Restored edited content, or null if no unsaved changes or conflict
   *
   * @remarks
   * Returns null if:
   * - No unsaved changes exist for this note
   * - Base hash mismatch (server content changed - conflict detected)
   * - Diff application fails (corrupted data)
   *
   * Caller should handle null by using server content and optionally prompting user about conflict.
   */
  const getUnsavedNote = useCallback(
    async (noteId: number, currentServerContent: string): Promise<string | null> => {
      try {
        const map = getUnsavedNotesMap();
        const stored = map.get(noteId);

        if (!stored) {
          return null;
        }

        // Check if server content has changed (conflict detection)
        const currentHash = await createContentHash(currentServerContent);
        if (currentHash !== stored.baseHash) {
          console.warn(
            `Base content mismatch for note ${noteId} - server content may have changed`
          );
          // Don't automatically apply diff - let caller handle conflict
          return null;
        }

        // Apply diff to reconstruct edited content
        const restored = applyDiff(currentServerContent, stored.diff);

        if (restored === null) {
          console.warn(`Failed to apply diff for note ${noteId} - clearing invalid data`);
          // Clear invalid diff
          map.delete(noteId);
          saveUnsavedNotesMap(map);
          return null;
        }

        return restored;
      } catch (error) {
        console.error(`Failed to get unsaved note ${noteId}:`, error);
        return null;
      }
    },
    [getUnsavedNotesMap, saveUnsavedNotesMap]
  );

  /**
   * Clear unsaved changes for a note (after successful save).
   *
   * @param {number} noteId - Note identifier
   */
  const clearUnsavedNote = useCallback(
    (noteId: number): void => {
      try {
        // Clear any pending debounce timer
        const timer = debounceTimers.current.get(noteId);
        if (timer) {
          clearTimeout(timer);
          debounceTimers.current.delete(noteId);
        }

        // Remove from localStorage
        const map = getUnsavedNotesMap();
        if (map.has(noteId)) {
          map.delete(noteId);
          saveUnsavedNotesMap(map);
        }
      } catch (error) {
        console.error(`Failed to clear unsaved note ${noteId}:`, error);
      }
    },
    [getUnsavedNotesMap, saveUnsavedNotesMap]
  );

  /**
   * Check if a note has unsaved changes.
   *
   * @param {number} noteId - Note identifier
   * @returns {boolean} True if note has unsaved changes
   */
  const hasUnsavedChanges = useCallback(
    (noteId: number): boolean => {
      const map = getUnsavedNotesMap();
      return map.has(noteId);
    },
    [getUnsavedNotesMap]
  );

  /**
   * Get list of all note IDs with unsaved changes.
   *
   * @returns {number[]} Array of note IDs
   */
  const getAllUnsavedNoteIds = useCallback((): number[] => {
    const map = getUnsavedNotesMap();
    return Array.from(map.keys());
  }, [getUnsavedNotesMap]);

  return {
    saveUnsavedNote,
    getUnsavedNote,
    clearUnsavedNote,
    hasUnsavedChanges,
    getAllUnsavedNoteIds
  };
}
