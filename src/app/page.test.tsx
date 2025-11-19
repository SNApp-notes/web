/**
 * @module app/page.test
 * @description Unit tests for main dashboard page
 */

import { describe, it, vi, beforeEach, expect } from 'vitest';

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: mockRedirect
}));

// Mock next/headers
const mockHeaders = vi.fn();
vi.mock('next/headers', () => ({
  headers: mockHeaders
}));

// Mock auth
const mockGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession
    }
  }
}));

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(new Headers());

    const { default: Dashboard } = await import('./page');
    await Dashboard();

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: expect.any(Headers)
    });
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should return null when user is authenticated', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'test@example.com' }
    });
    mockHeaders.mockResolvedValue(new Headers());

    const { default: Dashboard } = await import('./page');
    const result = await Dashboard();

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: expect.any(Headers)
    });
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
