import { describe, it, expect, vi } from 'vitest';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({
    variable: '--font-geist-sans'
  })),
  Geist_Mono: vi.fn(() => ({
    variable: '--font-geist-mono'
  }))
}));

describe('RootLayout', () => {
  it('should be importable', async () => {
    const layoutModule = await import('./layout');
    expect(typeof layoutModule.default).toBe('function');
  });

  it('should export metadata', async () => {
    const layoutModule = await import('./layout');
    expect(layoutModule.metadata).toBeDefined();
    expect(layoutModule.metadata.title).toBe('SNApp - Smart Note-Taking');
  });
});
