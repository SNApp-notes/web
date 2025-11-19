import { describe, it, expect } from 'vitest';

describe('NotePage', () => {
  it('should be importable', async () => {
    const pageModule = await import('./page');
    expect(typeof pageModule.default).toBe('function');
  });
});
