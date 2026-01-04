import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock server-only package to allow server modules in tests
vi.mock('server-only', () => ({}));

// Suppress jsdom CSS parsing errors
if (globalThis.window?._virtualConsole) {
  const originalEmit = globalThis.window._virtualConsole.emit;
  globalThis.window._virtualConsole.emit = function (event, type) {
    if (event === 'jsdomError' && type?.type === 'css-parsing') {
      // Suppress CSS parsing errors
      return;
    }
    return originalEmit.apply(this, arguments);
  };
}

// Mock Chakra UI's SegmentGroup to avoid act(...) warnings from internal state management
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  const { SegmentGroup } = await import('@/mocks/segment-group');
  return {
    ...actual,
    SegmentGroup
  };
});

// Fix for jsdom missing Range API (https://github.com/jsdom/jsdom/issues/3729)
if (typeof document !== 'undefined') {
  document.createRange = () => {
    const range = new Range();
    range.getClientRects = () => ({
      item: () => null,
      length: 0,
      [Symbol.iterator]: function* () {
        yield* [];
      }
    });
    return range;
  };
}

// Mock ResizeObserver for Chakra UI components that use Zag.js
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Mock implementation - do nothing
  }
  unobserve() {
    // Mock implementation - do nothing
  }
  disconnect() {
    // Mock implementation - do nothing
  }
};
