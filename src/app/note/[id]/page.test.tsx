/**
 * @module app/note/[id]/page.test
 * @description Unit tests for note page with auth and validation
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

describe('NotePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    mockHeaders.mockResolvedValue(new Headers());

    const { default: NotePage } = await import('./page');
    await NotePage({
      params: Promise.resolve({ id: '1' }),
      searchParams: Promise.resolve({})
    });

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should redirect to home when note id is invalid', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'test@example.com' }
    });
    mockHeaders.mockResolvedValue(new Headers());

    const { default: NotePage } = await import('./page');
    await NotePage({
      params: Promise.resolve({ id: 'invalid' }),
      searchParams: Promise.resolve({})
    });

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('should return null for valid authenticated user with valid note id', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: '1', email: 'test@example.com' }
    });
    mockHeaders.mockResolvedValue(new Headers());

    const { default: NotePage } = await import('./page');
    const result = await NotePage({
      params: Promise.resolve({ id: '42' }),
      searchParams: Promise.resolve({})
    });

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
