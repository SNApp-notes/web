import '@testing-library/jest-dom';

// Fix for jsdom missing Range API (https://github.com/jsdom/jsdom/issues/3729)
document.createRange = () => {
  const range = new Range();
  range.getClientRects = () => ({
    item: () => null,
    length: 0,
    [Symbol.iterator]: function* () {}
  });
  return range;
};
