/**
 * @module lib/localStorage
 * @description Type-safe localStorage utilities with error handling and namespacing.
 *
 * @remarks
 * **Features:**
 * - Namespaced keys with 'snapp:' prefix to avoid conflicts
 * - Type-safe get/set operations with JSON serialization
 * - Quota exceeded handling (graceful degradation)
 * - Browser compatibility checks
 * - Clear operations for logout/cleanup
 * - Editor state persistence (cursor position, scroll position)
 *
 * **Usage:**
 * ```typescript
 * import { getItem, setItem, removeItem, clearAllSnappData } from '@/lib/localStorage';
 *
 * // Save data
 * setItem('editorState', { cursor: { line: 10, column: 5 } });
 *
 * // Retrieve data
 * const state = getItem<EditorState>('editorState');
 *
 * // Save editor state for a note
 * saveEditorState(123, { line: 10, column: 5 }, scrollSnapshot);
 *
 * // Retrieve editor state
 * const editorState = getEditorState(123);
 *
 * // Remove data
 * removeItem('editorState');
 *
 * // Clear all SNApp data (on logout)
 * clearAllSnappData();
 * ```
 */

const NAMESPACE = 'snapp:';

/**
 * Editor state structure for persistence.
 *
 * @remarks
 * Stores both cursor position and scroll anchor data in a single object.
 * The scroll anchor approach mimics CodeMirror's internal scrollSnapshot() method.
 */
export interface EditorState {
  cursor: { line: number; column: number };
  scrollAnchor: {
    from: number; // Character position at scroll anchor line
    topOffset: number; // yMargin: distance from line top to viewport top
    scrollLeft: number; // xMargin: horizontal scroll position
  };
  timestamp: number;
}

/**
 * Check if localStorage is available and accessible.
 *
 * @returns {boolean} True if localStorage is available
 *
 * @remarks
 * Tests both existence and write capability.
 * Some browsers disable localStorage in private mode.
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = `${NAMESPACE}test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get namespaced key with 'snapp:' prefix.
 *
 * @param {string} key - Unnnamespaced key
 * @returns {string} Namespaced key
 */
function getNamespacedKey(key: string): string {
  return `${NAMESPACE}${key}`;
}

/**
 * Get item from localStorage with type safety.
 *
 * @template T
 * @param {string} key - Storage key (without namespace prefix)
 * @returns {T | null} Parsed value or null if not found/error
 *
 * @remarks
 * Automatically handles JSON parsing and error scenarios:
 * - Returns null if localStorage is unavailable
 * - Returns null if key doesn't exist
 * - Returns null if JSON parsing fails (logs warning)
 *
 * @example
 * ```typescript
 * interface EditorState {
 *   cursor: { line: number; column: number };
 * }
 *
 * const state = getItem<EditorState>('editorState');
 * if (state) {
 *   console.log(`Cursor at line ${state.cursor.line}`);
 * }
 * ```
 */
export function getItem<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const namespacedKey = getNamespacedKey(key);
    const item = localStorage.getItem(namespacedKey);

    if (item === null) {
      return null;
    }

    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to get item from localStorage: ${key}`, error);
    return null;
  }
}

/**
 * Set item in localStorage with type safety.
 *
 * @template T
 * @param {string} key - Storage key (without namespace prefix)
 * @param {T} value - Value to store (must be JSON serializable)
 * @returns {boolean} True if successful, false if failed
 *
 * @remarks
 * Handles common error scenarios:
 * - Returns false if localStorage is unavailable
 * - Returns false if quota is exceeded (logs warning)
 * - Returns false if JSON serialization fails
 *
 * @example
 * ```typescript
 * const success = setItem('editorState', {
 *   cursor: { line: 10, column: 5 },
 *   scroll: { top: 100, left: 0 }
 * });
 *
 * if (!success) {
 *   console.warn('Failed to save editor state');
 * }
 * ```
 */
export function setItem<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const namespacedKey = getNamespacedKey(key);
    const serialized = JSON.stringify(value);
    localStorage.setItem(namespacedKey, serialized);
    return true;
  } catch (error) {
    // Check if it's a quota exceeded error
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      console.warn('localStorage quota exceeded', error);
    } else {
      console.warn(`Failed to set item in localStorage: ${key}`, error);
    }
    return false;
  }
}

/**
 * Remove item from localStorage.
 *
 * @param {string} key - Storage key (without namespace prefix)
 *
 * @remarks
 * Silently fails if localStorage is unavailable.
 * Does not throw errors.
 *
 * @example
 * ```typescript
 * // Remove saved editor state
 * removeItem('editorState');
 * ```
 */
export function removeItem(key: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const namespacedKey = getNamespacedKey(key);
    localStorage.removeItem(namespacedKey);
  } catch (error) {
    console.warn(`Failed to remove item from localStorage: ${key}`, error);
  }
}

/**
 * Clear all SNApp-namespaced data from localStorage.
 *
 * @remarks
 * Used during logout to prevent data leakage between users.
 * Only removes keys with 'snapp:' prefix, leaving other apps' data intact.
 *
 * @example
 * ```typescript
 * // On logout
 * const handleLogout = () => {
 *   clearAllSnappData();
 *   // ... redirect to login
 * };
 * ```
 */
export function clearAllSnappData(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const keysToRemove: string[] = [];

    // Collect all SNApp keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(NAMESPACE)) {
        keysToRemove.push(key);
      }
    }

    // Remove collected keys
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear SNApp data from localStorage', error);
  }
}

/**
 * Get storage usage statistics (for debugging/monitoring).
 *
 * @returns {{ used: number; available: number; total: number } | null}
 *
 * @remarks
 * Returns approximate storage usage in bytes.
 * Only includes SNApp-namespaced keys.
 * Returns null if localStorage is unavailable or navigator.storage is not supported.
 */
export async function getStorageInfo(): Promise<{
  used: number;
  available: number;
  total: number;
} | null> {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    // Calculate SNApp storage usage
    let snappUsage = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(NAMESPACE)) {
        const value = localStorage.getItem(key);
        if (value) {
          // Approximate bytes: key length + value length (UTF-16 = 2 bytes per char)
          snappUsage += (key.length + value.length) * 2;
        }
      }
    }

    // Get total storage quota if available
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const total = estimate.quota || 0;
        const used = estimate.usage || 0;
        const available = total - used;

        return {
          used: snappUsage,
          available,
          total
        };
      } catch (error) {
        // If estimate fails, fall through to return only SNApp usage
        console.warn('Failed to get storage estimate', error);
      }
    }

    // Fallback: return only SNApp usage
    return {
      used: snappUsage,
      available: 0,
      total: 0
    };
  } catch (error) {
    console.warn('Failed to get storage info', error);
    return null;
  }
}

/**
 * Save editor state (cursor and scroll position) for a note.
 *
 * @param {number} noteId - Note ID
 * @param {Object} state - Editor state containing cursor and scroll anchor data
 * @returns {boolean} True if successful
 *
 * @remarks
 * Editor state is stored per note with key `editorState:{noteId}`.
 * Includes timestamp for staleness detection.
 * Uses scroll anchor approach to mimic CodeMirror's internal scrollSnapshot().
 *
 * @example
 * ```typescript
 * const state = {
 *   cursor: { line: 10, column: 5 },
 *   scrollAnchor: { from: 120, topOffset: 50, scrollLeft: 0 }
 * };
 * const success = saveEditorState(123, state);
 * ```
 */
export function saveEditorState(
  noteId: number,
  state: {
    cursor: { line: number; column: number };
    scrollAnchor: { from: number; topOffset: number; scrollLeft: number };
  }
): boolean {
  const editorState: EditorState = {
    ...state,
    timestamp: Date.now()
  };
  return setItem(`editorState:${noteId}`, editorState);
}

/**
 * Get editor state for a note.
 *
 * @param {number} noteId - Note ID
 * @returns {EditorState | null} Editor state or null
 *
 * @example
 * ```typescript
 * const state = getEditorState(123);
 * if (state) {
 *   console.log(`Cursor at line ${state.cursor.line}, column ${state.cursor.column}`);
 * }
 * ```
 */
export function getEditorState(noteId: number): EditorState | null {
  return getItem<EditorState>(`editorState:${noteId}`);
}

/**
 * Remove editor state for a note.
 *
 * @param {number} noteId - Note ID
 *
 * @example
 * ```typescript
 * removeEditorState(123);
 * ```
 */
export function removeEditorState(noteId: number): void {
  removeItem(`editorState:${noteId}`);
}
