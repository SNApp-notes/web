import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import SettingsPage from './page';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

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

// Mock SettingsForm component
vi.mock('./SettingsForm', () => ({
  default: () => null
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login if user is not authenticated', async () => {
    // Mock headers
    vi.mocked(headers).mockResolvedValue(
      new Headers() as unknown as Headers & Awaited<ReturnType<typeof headers>>
    );

    // Mock no session
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    // Call the component
    await SettingsPage();

    // Verify redirect was called
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('should render SettingsForm when user is authenticated', async () => {
    // Mock headers
    vi.mocked(headers).mockResolvedValue(
      new Headers() as unknown as Headers & Awaited<ReturnType<typeof headers>>
    );

    // Mock authenticated session
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: {
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        token: 'token-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Call the component - should not throw or redirect
    const result = await SettingsPage();

    // Verify redirect was not called
    expect(redirect).not.toHaveBeenCalled();

    // Verify result is a valid React element
    expect(result).toBeDefined();
  });

  it('should call auth.api.getSession with headers', async () => {
    const mockHeaders = new Headers() as unknown as Headers &
      Awaited<ReturnType<typeof headers>>;
    vi.mocked(headers).mockResolvedValue(mockHeaders);

    // Mock authenticated session
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: {
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        token: 'token-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await SettingsPage();

    // Verify getSession was called with correct headers
    expect(auth.api.getSession).toHaveBeenCalledWith({
      headers: mockHeaders
    });
  });
});
