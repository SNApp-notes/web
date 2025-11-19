import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signOut: vi.fn()
    }
  }
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    verification: {
      findUnique: vi.fn(),
      delete: vi.fn()
    },
    user: {
      delete: vi.fn()
    }
  }
}));

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

describe('DELETE /api/auth/delete-account', () => {
  let consoleLogSpy: Mock;
  let consoleErrorSpy: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const createMockRequest = (token?: string): NextRequest => {
    const url = token
      ? `http://localhost:3000/api/auth/delete-account?token=${token}`
      : 'http://localhost:3000/api/auth/delete-account';

    return {
      nextUrl: new URL(url),
      url,
      headers: new Headers()
    } as unknown as NextRequest;
  };

  describe('Token Validation', () => {
    it('should redirect with error when token is missing', async () => {
      const request = createMockRequest();

      const response = await GET(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Temporary redirect
      const location = response.headers.get('location');
      expect(location).toContain('/settings?error=invalid-token');
    });

    it('should redirect with error when token is empty string', async () => {
      const request = createMockRequest('');

      const response = await GET(request);

      expect(response).toBeInstanceOf(NextResponse);
      const location = response.headers.get('location');
      expect(location).toContain('/settings?error=invalid-token');
    });

    it('should redirect with error when verification record is not found', async () => {
      const request = createMockRequest('invalid-token-123');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue(null);

      const response = await GET(request);

      expect(prisma.verification.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'delete_invalid-token-123'
        }
      });

      const location = response.headers.get('location');
      expect(location).toContain('/settings?error=invalid-token');
    });
  });

  describe('Token Expiration', () => {
    it('should redirect with error and delete token when token has expired', async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      const request = createMockRequest('expired-token');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_expired-token',
        identifier: 'user-123',
        value: 'account_deletion',
        expiresAt: expiredDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      vi.mocked(prisma.verification.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.verification.delete>>
      );

      const response = await GET(request);

      expect(prisma.verification.delete).toHaveBeenCalledWith({
        where: {
          id: 'delete_expired-token'
        }
      });

      const location = response.headers.get('location');
      expect(location).toContain('/settings?error=token-expired');
    });

    it('should accept token that expires in the future', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const request = createMockRequest('valid-token');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_valid-token',
        identifier: 'user-123',
        value: 'account_deletion',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      vi.mocked(prisma.user.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.user.delete>>
      );
      vi.mocked(prisma.verification.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.verification.delete>>
      );
      vi.mocked(auth.api.signOut).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof auth.api.signOut>>
      );

      const response = await GET(request);

      expect(prisma.user.delete).toHaveBeenCalled();
      const location = response.headers.get('location');
      expect(location).toContain('/login?message=account-deleted');
    });
  });

  describe('Verification Value Validation', () => {
    it('should redirect with error when verification value is not account_deletion', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const request = createMockRequest('wrong-type-token');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_wrong-type-token',
        identifier: 'user-123',
        value: 'email_verification', // Wrong value
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      const response = await GET(request);

      expect(prisma.user.delete).not.toHaveBeenCalled();
      const location = response.headers.get('location');
      expect(location).toContain('/settings?error=invalid-token');
    });

    it('should proceed when verification value is exactly account_deletion', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const request = createMockRequest('correct-token');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_correct-token',
        identifier: 'user-123',
        value: 'account_deletion',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      vi.mocked(prisma.user.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.user.delete>>
      );
      vi.mocked(prisma.verification.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.verification.delete>>
      );
      vi.mocked(auth.api.signOut).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof auth.api.signOut>>
      );

      const response = await GET(request);

      expect(prisma.user.delete).toHaveBeenCalled();
      const location = response.headers.get('location');
      expect(location).toContain('/login?message=account-deleted');
    });
  });

  describe('Successful Account Deletion', () => {
    it('should delete user, verification token, and sign out successfully', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const request = createMockRequest('valid-token-123');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_valid-token-123',
        identifier: 'user-456',
        value: 'account_deletion',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      vi.mocked(prisma.user.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.user.delete>>
      );
      vi.mocked(prisma.verification.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.verification.delete>>
      );
      vi.mocked(auth.api.signOut).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof auth.api.signOut>>
      );

      const response = await GET(request);

      // Verify user deletion
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: {
          id: 'user-456'
        }
      });

      // Verify token cleanup
      expect(prisma.verification.delete).toHaveBeenCalledWith({
        where: {
          id: 'delete_valid-token-123'
        }
      });

      // Verify sign out
      expect(auth.api.signOut).toHaveBeenCalledWith({
        headers: expect.any(Headers)
      });

      // Verify redirect
      const location = response.headers.get('location');
      expect(location).toContain('/login?message=account-deleted');
    });

    it('should handle signOut errors gracefully and still redirect', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const request = createMockRequest('token-with-signout-error');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_token-with-signout-error',
        identifier: 'user-789',
        value: 'account_deletion',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      vi.mocked(prisma.user.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.user.delete>>
      );
      vi.mocked(prisma.verification.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.verification.delete>>
      );
      vi.mocked(auth.api.signOut).mockRejectedValue(new Error('Session already expired'));

      const response = await GET(request);

      // User and token should still be deleted
      expect(prisma.user.delete).toHaveBeenCalled();
      expect(prisma.verification.delete).toHaveBeenCalled();

      // SignOut error should be caught and logged
      expect(consoleLogSpy).toHaveBeenCalledWith('User already signed out or deleted');

      // Should still redirect to success page
      const location = response.headers.get('location');
      expect(location).toContain('/login?message=account-deleted');
    });

    it('should delete verification token after successful user deletion', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const request = createMockRequest('cleanup-token');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_cleanup-token',
        identifier: 'user-cleanup',
        value: 'account_deletion',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      vi.mocked(prisma.user.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.user.delete>>
      );
      vi.mocked(prisma.verification.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.verification.delete>>
      );
      vi.mocked(auth.api.signOut).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof auth.api.signOut>>
      );

      await GET(request);

      // Verify the order and calls
      const userDeleteCall = vi.mocked(prisma.user.delete).mock.invocationCallOrder[0];
      const verificationDeleteCall = vi.mocked(prisma.verification.delete).mock
        .invocationCallOrder[0];

      // User should be deleted before verification cleanup
      expect(userDeleteCall).toBeLessThan(verificationDeleteCall);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during verification lookup', async () => {
      const request = createMockRequest('error-token');

      vi.mocked(prisma.verification.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await GET(request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Account deletion error:',
        expect.any(Error)
      );

      const location = response.headers.get('location');
      expect(location).toContain('/settings?error=deletion-failed');
    });

    it('should handle database errors during user deletion', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const request = createMockRequest('deletion-error-token');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_deletion-error-token',
        identifier: 'user-error',
        value: 'account_deletion',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      vi.mocked(prisma.user.delete).mockRejectedValue(new Error('User deletion failed'));

      const response = await GET(request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Account deletion error:',
        expect.any(Error)
      );

      const location = response.headers.get('location');
      expect(location).toContain('/settings?error=deletion-failed');
    });

    it('should handle database errors during token cleanup', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const request = createMockRequest('cleanup-error-token');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_cleanup-error-token',
        identifier: 'user-cleanup-error',
        value: 'account_deletion',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      vi.mocked(prisma.user.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.user.delete>>
      );
      vi.mocked(prisma.verification.delete).mockRejectedValue(
        new Error('Token cleanup failed')
      );

      const response = await GET(request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Account deletion error:',
        expect.any(Error)
      );

      const location = response.headers.get('location');
      expect(location).toContain('/settings?error=deletion-failed');
    });
  });

  describe('URL Handling', () => {
    it('should correctly prefix token with delete_ in database lookup', async () => {
      const request = createMockRequest('abc123xyz');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue(null);

      await GET(request);

      expect(prisma.verification.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'delete_abc123xyz'
        }
      });
    });

    it('should preserve base URL in redirects', async () => {
      const request = createMockRequest();

      const response = await GET(request);

      const location = response.headers.get('location');
      expect(location).toContain('http://localhost:3000');
    });

    it('should handle different base URLs correctly', async () => {
      const url = 'https://snapp.example.com/api/auth/delete-account?token=test';
      const request = {
        nextUrl: new URL(url),
        url,
        headers: new Headers()
      } as unknown as NextRequest;

      vi.mocked(prisma.verification.findUnique).mockResolvedValue(null);

      const response = await GET(request);

      const location = response.headers.get('location');
      expect(location).toContain(
        'https://snapp.example.com/settings?error=invalid-token'
      );
    });
  });

  describe('Token ID Format', () => {
    it('should handle various token formats correctly', async () => {
      const tokens = [
        'simple-token',
        'token_with_underscores',
        'token-with-dashes',
        'UPPERCASE-TOKEN',
        'mixedCase123',
        '1234567890',
        'very-long-token-with-multiple-segments-and-characters-12345'
      ];

      for (const token of tokens) {
        vi.clearAllMocks();
        vi.mocked(prisma.verification.findUnique).mockResolvedValue(null);

        const request = createMockRequest(token);
        await GET(request);

        expect(prisma.verification.findUnique).toHaveBeenCalledWith({
          where: {
            id: `delete_${token}`
          }
        });
      }
    });
  });

  describe('Cascade Delete Behavior', () => {
    it('should rely on cascade delete for related data (notes, sessions, accounts)', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const request = createMockRequest('cascade-token');

      vi.mocked(prisma.verification.findUnique).mockResolvedValue({
        id: 'delete_cascade-token',
        identifier: 'user-cascade',
        value: 'account_deletion',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Awaited<ReturnType<typeof prisma.verification.findUnique>>);

      vi.mocked(prisma.user.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.user.delete>>
      );
      vi.mocked(prisma.verification.delete).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof prisma.verification.delete>>
      );
      vi.mocked(auth.api.signOut).mockResolvedValue(
        {} as unknown as Awaited<ReturnType<typeof auth.api.signOut>>
      );

      await GET(request);

      // Only user.delete should be called, not separate calls for notes/sessions
      expect(prisma.user.delete).toHaveBeenCalledTimes(1);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: {
          id: 'user-cascade'
        }
      });
    });
  });
});
