/**
 * @module app/verify-email/page.test
 * @description Unit tests for verify email page
 */

import { describe, it, vi, beforeEach, expect } from 'vitest';

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: mockRedirect
}));

// Mock verifyEmailAction
const mockVerifyEmailAction = vi.fn();
vi.mock('@/app/actions/auth', () => ({
  verifyEmailAction: mockVerifyEmailAction
}));

// Mock VerifyEmailClient component
const mockVerifyEmailClient = vi.fn(({ success, error, isExpired }) => ({
  success,
  error,
  isExpired
}));
vi.mock('@/components/VerifyEmailClient', () => ({
  default: mockVerifyEmailClient
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to home when no token is provided', async () => {
    mockRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { default: VerifyEmailPage } = await import('./page');

    await expect(
      VerifyEmailPage({
        searchParams: Promise.resolve({})
      })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/');
    expect(mockVerifyEmailAction).not.toHaveBeenCalled();
  });

  it('should call verifyEmailAction with token and pass result to client component', async () => {
    mockVerifyEmailAction.mockResolvedValue({
      success: true,
      error: undefined,
      isExpired: false
    });

    const { default: VerifyEmailPage } = await import('./page');

    const result = await VerifyEmailPage({
      searchParams: Promise.resolve({ token: 'valid-token' })
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockVerifyEmailAction).toHaveBeenCalledWith('valid-token');
    // Verify the component returns JSX
    expect(result).toBeDefined();
    expect(result.props.success).toBe(true);
    expect(result.props.error).toBeUndefined();
    expect(result.props.isExpired).toBe(false);
  });

  it('should handle verification failure', async () => {
    mockVerifyEmailAction.mockResolvedValue({
      success: false,
      error: 'Invalid token',
      isExpired: false
    });

    const { default: VerifyEmailPage } = await import('./page');

    const result = await VerifyEmailPage({
      searchParams: Promise.resolve({ token: 'invalid-token' })
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockVerifyEmailAction).toHaveBeenCalledWith('invalid-token');
    expect(result.props.success).toBe(false);
    expect(result.props.error).toBe('Invalid token');
    expect(result.props.isExpired).toBe(false);
  });

  it('should handle expired token', async () => {
    mockVerifyEmailAction.mockResolvedValue({
      success: false,
      error: 'Token expired',
      isExpired: true
    });

    const { default: VerifyEmailPage } = await import('./page');

    const result = await VerifyEmailPage({
      searchParams: Promise.resolve({ token: 'expired-token' })
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockVerifyEmailAction).toHaveBeenCalledWith('expired-token');
    expect(result.props.success).toBe(false);
    expect(result.props.error).toBe('Token expired');
    expect(result.props.isExpired).toBe(true);
  });
});
