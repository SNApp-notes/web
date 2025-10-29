import { vi } from 'vitest';
import { useSession } from '@/lib/auth-client';

export const createMockSession = (authenticated: boolean) => {
  if (!authenticated) {
    return {
      data: null,
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined)
    };
  }

  return {
    data: {
      user: {
        id: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        image: null
      },
      session: {
        id: 'session-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '1',
        expiresAt: new Date(Date.now() + 86400000),
        token: 'mock-token',
        ipAddress: null,
        userAgent: null
      }
    },
    isPending: false,
    isRefetching: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined)
  };
};

export const setupMockSession = (
  authenticated: boolean,
  mockUseSession?: ReturnType<typeof vi.mocked<typeof useSession>>
) => {
  const mock = mockUseSession || vi.mocked(useSession);
  mock.mockReturnValue(createMockSession(authenticated) as ReturnType<typeof useSession>);
};
