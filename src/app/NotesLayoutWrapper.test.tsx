import { describe, it, expect } from 'vitest';

describe('NotesLayoutWrapper', () => {
  it('should be importable', async () => {
    const wrapperModule = await import('./NotesLayoutWrapper');
    expect(typeof wrapperModule.default).toBe('function');
  });
});
