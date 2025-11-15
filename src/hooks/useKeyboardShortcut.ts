/**
 * @module hooks/useKeyboardShortcut
 * @description Custom hook for registering keyboard shortcuts with modifier keys.
 * Provides a clean API for handling Ctrl/Cmd, Shift, and Alt combinations.
 *
 * @dependencies
 * - React - useEffect and useMemo hooks
 *
 * @remarks
 * **Features:**
 * - Support for Ctrl/Cmd, Shift, and Alt modifiers
 * - Cross-platform (Mac uses Cmd, others use Ctrl)
 * - Prevents default browser behavior
 * - Automatic cleanup on unmount
 * - Type-safe key definitions
 *
 * **Shortcut Format:**
 * - Single key: 'K', 'F', 'S'
 * - With Ctrl: 'CTRL+K', 'CTRL+S'
 * - With Shift: 'SHIFT+F', 'CTRL+SHIFT+F'
 * - With Alt: 'ALT+K', 'CTRL+ALT+K'
 * - With Meta (Mac Cmd): 'META+K'
 *
 * @example
 * ```tsx
 * import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
 *
 * function MyComponent() {
 *   // Register Ctrl+Shift+F
 *   useKeyboardShortcut('CTRL+SHIFT+F', () => {
 *     console.log('Ctrl+Shift+F pressed!');
 *   });
 *
 *   // Register Ctrl+S
 *   useKeyboardShortcut('CTRL+S', () => {
 *     console.log('Ctrl+S pressed!');
 *   });
 *
 *   return <div>Press keyboard shortcuts...</div>;
 * }
 * ```
 */

'use client';

import { useEffect, useMemo } from 'react';

/* Code taken from jQuery Terminal */
// IE mapping
const keyMapping: Record<string, string> = {
  SPACEBAR: ' ',
  UP: 'ArrowUP',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  DEL: 'Delete',
  MULTIPLY: '*',
  DIVIDE: '/',
  SUBTRACT: '-',
  ADD: '+'
};

function ieKeyFix(e: KeyboardEvent): string {
  const key = e.key.toUpperCase();
  if (keyMapping[key]) {
    return keyMapping[key];
  }
  return key;
}

function getKey(e: KeyboardEvent): string {
  if (e.key) {
    const key = ieKeyFix(e).toUpperCase();
    if (key === 'CONTROL') {
      return 'CTRL';
    } else {
      const combo: string[] = [];
      if (e.ctrlKey) {
        combo.push('CTRL');
      }
      if (e.metaKey && key !== 'META') {
        combo.push('META');
      }
      if (e.shiftKey && key !== 'SHIFT') {
        combo.push('SHIFT');
      }
      if (e.altKey && key !== 'ALT') {
        combo.push('ALT');
      }
      if (combo.length && key === ' ') {
        combo.push('SPACEBAR');
      } else if (e.key) {
        combo.push(key);
      }
      return combo.join('+');
    }
  }
  return '';
}

// Global registry for all keyboard shortcuts
const shortcutRegistry = new Map<string, Set<() => void>>();
let globalListenerAttached = false;

// Global event handler that manages all shortcuts
function globalKeyDownHandler(event: KeyboardEvent) {
  const pressedKey = getKey(event);
  const callbacks = shortcutRegistry.get(pressedKey);

  if (callbacks && callbacks.size > 0) {
    // Prevent default browser behavior
    event.preventDefault();
    event.stopPropagation();

    // Execute all callbacks registered for this shortcut
    callbacks.forEach((callback) => callback());
  }
}

/**
 * Hook for registering keyboard shortcuts with modifier keys.
 * Uses a single global event listener for optimal performance.
 *
 * @hook
 * @param {string | string[]} shortcut - Shortcut string or array of shortcuts (e.g., 'CTRL+S' or ['CTRL+S', 'META+S'])
 * @param {() => void} callback - Callback to execute when shortcut is triggered
 *
 * @remarks
 * **Shortcut Format:**
 * - Use uppercase letters: 'K', 'F', 'S'
 * - Modifiers: 'CTRL', 'SHIFT', 'ALT', 'META'
 * - Combine with '+': 'CTRL+SHIFT+F'
 *
 * **Platform Differences:**
 * - CTRL works on all platforms (maps to Cmd on Mac via ctrlKey)
 * - META specifically targets Mac Cmd key
 *
 * **Multiple Shortcuts:**
 * - Pass an array to register multiple shortcuts for the same callback
 * - Example: ['CTRL+S', 'META+S'] for cross-platform save
 *
 * **Default Behavior:**
 * - Prevents default browser behavior when shortcut is triggered
 * - Stops event propagation to prevent conflicts
 *
 * **Performance:**
 * - Uses a single global event listener for all shortcuts
 * - Registers/unregisters callbacks in a centralized registry
 *
 * **Cleanup:**
 * - Automatically removes callback on unmount
 * - Removes global listener when no shortcuts are registered
 *
 * @example
 * ```tsx
 * // Simple shortcut (Ctrl+S)
 * useKeyboardShortcut('CTRL+S', handleSave);
 *
 * // Complex shortcut (Ctrl+Shift+F)
 * useKeyboardShortcut('CTRL+SHIFT+F', openSearchModal);
 *
 * // Multiple shortcuts for cross-platform support
 * useKeyboardShortcut(['CTRL+S', 'META+S'], handleSave);
 *
 * // Alt shortcut (Alt+N)
 * useKeyboardShortcut('ALT+N', createNewNote);
 * ```
 */
export function useKeyboardShortcut(shortcut: string | string[], callback: () => void) {
  // Normalize shortcut to array for consistent handling
  const shortcuts = useMemo(
    () => (Array.isArray(shortcut) ? shortcut : [shortcut]),
    [shortcut]
  );

  useEffect(() => {
    // Attach global listener if not already attached
    if (!globalListenerAttached) {
      document.addEventListener('keydown', globalKeyDownHandler);
      globalListenerAttached = true;
    }

    // Register all shortcuts
    shortcuts.forEach((sc) => {
      if (!shortcutRegistry.has(sc)) {
        shortcutRegistry.set(sc, new Set());
      }
      shortcutRegistry.get(sc)!.add(callback);
    });

    // Cleanup on unmount
    return () => {
      shortcuts.forEach((sc) => {
        const callbacks = shortcutRegistry.get(sc);
        if (callbacks) {
          callbacks.delete(callback);

          // Remove shortcut entry if no callbacks left
          if (callbacks.size === 0) {
            shortcutRegistry.delete(sc);
          }
        }
      });

      // Remove global listener if no shortcuts registered
      if (shortcutRegistry.size === 0 && globalListenerAttached) {
        document.removeEventListener('keydown', globalKeyDownHandler);
        globalListenerAttached = false;
      }
    };
  }, [shortcuts, callback]);
}
