import '@testing-library/jest-dom';

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

// Fix for jsdom missing Range API (https://github.com/jsdom/jsdom/issues/3729)
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
