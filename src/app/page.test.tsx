/**
 * @module app/page.test
 * @description Unit tests for main dashboard page - coverage focused
 */

import { describe, it, vi, beforeEach, expect } from 'vitest';

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: mockRedirect
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn()
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn()
    }
  }
}));

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const { default: Dashboard } = await import('./page');
    // Just verify it's a function
    expect(typeof Dashboard).toBe('function');
  });
});
