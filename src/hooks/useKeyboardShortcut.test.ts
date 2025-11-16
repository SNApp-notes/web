/**
 * @module hooks/useKeyboardShortcut.test
 * @description Unit tests for useKeyboardShortcut hook
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardShortcut } from './useKeyboardShortcut';

describe('useKeyboardShortcut', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    document.removeEventListener('keydown', vi.fn());
  });

  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
  });

  describe('Single key shortcut', () => {
    it('should trigger callback on matching key press', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('K', callback));

      // Simulate 'K' key press
      const event = new KeyboardEvent('keydown', { key: 'K' });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not trigger callback on non-matching key press', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('K', callback));

      // Simulate 'F' key press
      const event = new KeyboardEvent('keydown', { key: 'F' });
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should be case-insensitive', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('K', callback));

      // Simulate lowercase 'k' key press
      const event = new KeyboardEvent('keydown', { key: 'k' });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modifier keys', () => {
    it('should trigger callback on CTRL+K', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('CTRL+K', callback));

      // Simulate Ctrl+K
      const event = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should trigger callback on SHIFT+F', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('SHIFT+F', callback));

      // Simulate Shift+F
      const event = new KeyboardEvent('keydown', { key: 'F', shiftKey: true });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should trigger callback on ALT+K', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('ALT+K', callback));

      // Simulate Alt+K
      const event = new KeyboardEvent('keydown', { key: 'K', altKey: true });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should trigger callback on META+K (Mac Cmd)', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('META+K', callback));

      // Simulate Meta+K (Mac Cmd)
      const event = new KeyboardEvent('keydown', { key: 'K', metaKey: true });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should trigger callback on CTRL+SHIFT+F', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('CTRL+SHIFT+F', callback));

      // Simulate Ctrl+Shift+F
      const event = new KeyboardEvent('keydown', {
        key: 'F',
        ctrlKey: true,
        shiftKey: true
      });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should trigger callback on CTRL+ALT+K', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('CTRL+ALT+K', callback));

      // Simulate Ctrl+Alt+K
      const event = new KeyboardEvent('keydown', {
        key: 'K',
        ctrlKey: true,
        altKey: true
      });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not trigger if modifier mismatch', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('CTRL+K', callback));

      // Simulate 'K' without Ctrl
      const event = new KeyboardEvent('keydown', { key: 'K' });
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Multiple shortcuts', () => {
    it('should trigger callback for any shortcut in array', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut(['CTRL+S', 'META+S'], callback));

      // Simulate Ctrl+S
      const event1 = new KeyboardEvent('keydown', { key: 'S', ctrlKey: true });
      document.dispatchEvent(event1);
      expect(callback).toHaveBeenCalledTimes(1);

      // Simulate Meta+S (Mac Cmd+S)
      const event2 = new KeyboardEvent('keydown', { key: 'S', metaKey: true });
      document.dispatchEvent(event2);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should not trigger on unregistered shortcut', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut(['CTRL+S', 'META+S'], callback));

      // Simulate Alt+S (not registered)
      const event = new KeyboardEvent('keydown', { key: 'S', altKey: true });
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Global listener management', () => {
    it('should attach global event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const callback = vi.fn();

      renderHook(() => useKeyboardShortcut('CTRL+K', callback));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should remove global event listener on unmount when no shortcuts remain', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const callback = vi.fn();

      const { unmount } = renderHook(() => useKeyboardShortcut('CTRL+K', callback));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should keep listener active if other shortcuts are registered', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // Register two shortcuts
      const { unmount: unmount1 } = renderHook(() =>
        useKeyboardShortcut('CTRL+K', callback1)
      );
      renderHook(() => useKeyboardShortcut('CTRL+S', callback2));

      // Unmount first hook
      unmount1();

      // Second callback should still work
      const event = new KeyboardEvent('keydown', { key: 'S', ctrlKey: true });
      document.dispatchEvent(event);
      expect(callback2).toHaveBeenCalledTimes(1);

      // First callback should not work anymore
      const event2 = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true });
      document.dispatchEvent(event2);
      expect(callback1).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup on unmount', () => {
    it('should remove callback from registry on unmount', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() => useKeyboardShortcut('CTRL+K', callback));

      // Verify callback works before unmount
      const event1 = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true });
      document.dispatchEvent(event1);
      expect(callback).toHaveBeenCalledTimes(1);

      // Unmount hook
      unmount();

      // Verify callback doesn't work after unmount
      const event2 = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true });
      document.dispatchEvent(event2);
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should remove all shortcuts when multiple are registered', () => {
      const callback = vi.fn();
      const { unmount } = renderHook(() =>
        useKeyboardShortcut(['CTRL+S', 'META+S'], callback)
      );

      // Verify callbacks work before unmount
      const event1 = new KeyboardEvent('keydown', { key: 'S', ctrlKey: true });
      document.dispatchEvent(event1);
      expect(callback).toHaveBeenCalledTimes(1);

      const event2 = new KeyboardEvent('keydown', { key: 'S', metaKey: true });
      document.dispatchEvent(event2);
      expect(callback).toHaveBeenCalledTimes(2);

      // Unmount hook
      unmount();

      // Verify neither callback works after unmount
      const event3 = new KeyboardEvent('keydown', { key: 'S', ctrlKey: true });
      document.dispatchEvent(event3);
      const event4 = new KeyboardEvent('keydown', { key: 'S', metaKey: true });
      document.dispatchEvent(event4);
      expect(callback).toHaveBeenCalledTimes(2); // Still 2, not 4
    });
  });

  describe('Event behavior', () => {
    it('should prevent default behavior on matching shortcut', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('CTRL+S', callback));

      const event = new KeyboardEvent('keydown', { key: 'S', ctrlKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should stop propagation on matching shortcut', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('CTRL+K', callback));

      const event = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true });
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      document.dispatchEvent(event);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Multiple callbacks for same shortcut', () => {
    it('should execute all callbacks registered for same shortcut', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      renderHook(() => useKeyboardShortcut('CTRL+K', callback1));
      renderHook(() => useKeyboardShortcut('CTRL+K', callback2));

      const event = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true });
      document.dispatchEvent(event);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Special keys', () => {
    it('should handle spacebar with modifiers', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('CTRL+SPACEBAR', callback));

      const event = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle arrow keys', () => {
      const callback = vi.fn();
      renderHook(() => useKeyboardShortcut('ARROWDOWN', callback));

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
