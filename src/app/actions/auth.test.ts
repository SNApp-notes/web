/**
 * @module actions/auth.test
 * @description Unit tests for authentication server actions
 *
 * Note: These tests focus on testing the validation logic and error handling paths.
 * The Better Auth API integration is complex and best tested via E2E tests.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  signUpAction,
  signInAction,
  signOutAction,
  requestAccountDeletionAction,
  getUserAuthMethod,
  changePasswordAction,
  forgotPasswordAction,
  resetPasswordAction
} from './auth';
import prisma from '@/lib/prisma';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn()
    }
  }
}));

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn()
}));

// Mock email
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn()
}));

// Import mocks after defining them
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { sendEmail } from '@/lib/email';

describe('auth actions', () => {
  const mockUserId = 'test-user-id';
  const mockEmail = 'test@example.com';
  const mockHeaders = new Headers();

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Spy on console.error and console.log to suppress expected logs
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock headers
    vi.mocked(headers).mockResolvedValue(mockHeaders);

    // Clean up test data
    await prisma.verification.deleteMany({
      where: { identifier: mockUserId }
    });
    await prisma.account.deleteMany({
      where: { userId: mockUserId }
    });
    await prisma.user.deleteMany({
      where: { id: mockUserId }
    });
  });

  describe('signUpAction - Validation', () => {
    it('should return validation errors for invalid email', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      formData.append('password', 'password123');
      formData.append('name', 'Test User');

      const result = await signUpAction({}, formData);

      expect(result.errors?.email).toBeDefined();
      expect(result.errors?.email?.[0]).toContain('valid email');
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should return validation errors for short password', async () => {
      const formData = new FormData();
      formData.append('email', mockEmail);
      formData.append('password', 'short');
      formData.append('name', 'Test User');

      const result = await signUpAction({}, formData);

      expect(result.errors?.password).toBeDefined();
      expect(result.errors?.password?.[0]).toContain('8 characters');
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should return validation errors for missing name', async () => {
      const formData = new FormData();
      formData.append('email', mockEmail);
      formData.append('password', 'password123');
      formData.append('name', '');

      const result = await signUpAction({}, formData);

      expect(result.errors?.name).toBeDefined();
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should handle auth API errors', async () => {
      const formData = new FormData();
      formData.append('email', mockEmail);
      formData.append('password', 'password123');
      formData.append('name', 'Test User');

      vi.mocked(auth.api.signUpEmail).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await signUpAction({}, formData);

      expect(result.success).toBeUndefined();
      expect(result.message).toContain('unexpected error');
      expect(result.message).toContain('Database connection failed');
    });
  });

  describe('signInAction - Validation', () => {
    it('should return validation errors for invalid email', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      formData.append('password', 'password123');

      const result = await signInAction({}, formData);

      expect(result.errors?.email).toBeDefined();
      expect(result.errors?.email?.[0]).toContain('valid email');
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should return validation errors for missing password', async () => {
      const formData = new FormData();
      formData.append('email', mockEmail);
      formData.append('password', '');

      const result = await signInAction({}, formData);

      expect(result.errors?.password).toBeDefined();
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should handle auth API errors', async () => {
      const formData = new FormData();
      formData.append('email', mockEmail);
      formData.append('password', 'password123');

      vi.mocked(auth.api.signInEmail).mockRejectedValue(new Error('Network error'));

      const result = await signInAction({}, formData);

      expect(result.success).toBeUndefined();
      expect(result.message).toContain('unexpected error');
    });
  });

  describe('signOutAction', () => {
    it('should call auth.api.signOut', async () => {
      vi.mocked(auth.api.signOut).mockResolvedValue(
        undefined as unknown as Awaited<ReturnType<typeof auth.api.signOut>>
      );

      await signOutAction();

      expect(auth.api.signOut).toHaveBeenCalledWith({
        headers: mockHeaders
      });
    });

    it('should handle signout errors gracefully', async () => {
      vi.mocked(auth.api.signOut).mockRejectedValue(new Error('Session error'));

      // Should not throw
      await expect(signOutAction()).resolves.toBeUndefined();
    });
  });

  describe('requestAccountDeletionAction', () => {
    beforeEach(async () => {
      // Create test user
      await prisma.user.create({
        data: {
          id: mockUserId,
          email: mockEmail,
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    });

    it('should return error when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const result = await requestAccountDeletionAction();

      expect(result.success).toBeUndefined();
      expect(result.message).toBe('You must be logged in to delete your account');
    });

    it('should return error when user has no email', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: mockUserId, email: '' },
        session: { id: 'session-id', userId: mockUserId }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

      const result = await requestAccountDeletionAction();

      expect(result.success).toBeUndefined();
      expect(result.message).toBe('No email address found for your account');
    });

    it('should create verification token in database', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: mockUserId, email: mockEmail, name: 'Test User' },
        session: { id: 'session-id', userId: mockUserId }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

      vi.mocked(sendEmail).mockResolvedValue(undefined);

      const result = await requestAccountDeletionAction();

      expect(result.success).toBe(true);

      // Verify token was created
      const verification = await prisma.verification.findFirst({
        where: { identifier: mockUserId }
      });
      expect(verification).toBeDefined();
      expect(verification?.value).toBe('account_deletion');
      expect(verification?.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Session error'));

      const result = await requestAccountDeletionAction();

      expect(result.success).toBeUndefined();
      expect(result.message).toContain('unexpected error');
    });
  });

  describe('getUserAuthMethod', () => {
    it('should return false when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const result = await getUserAuthMethod();

      expect(result.hasPassword).toBe(false);
    });

    it('should return true when user has password', async () => {
      // Create test user with password
      await prisma.user.create({
        data: {
          id: mockUserId,
          email: mockEmail,
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      await prisma.account.create({
        data: {
          id: 'account-id',
          userId: mockUserId,
          providerId: 'credential',
          accountId: mockEmail,
          password: 'hashed-password'
        }
      });

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: mockUserId, email: mockEmail },
        session: { id: 'session-id', userId: mockUserId }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

      const result = await getUserAuthMethod();

      expect(result.hasPassword).toBe(true);
    });

    it('should return false when user has no password (OAuth only)', async () => {
      // Create test user without password
      await prisma.user.create({
        data: {
          id: mockUserId,
          email: mockEmail,
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      await prisma.account.create({
        data: {
          id: 'account-id',
          userId: mockUserId,
          providerId: 'github',
          accountId: 'github-123'
        }
      });

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: mockUserId, email: mockEmail },
        session: { id: 'session-id', userId: mockUserId }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

      const result = await getUserAuthMethod();

      expect(result.hasPassword).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(auth.api.getSession).mockRejectedValue(new Error('Session error'));

      const result = await getUserAuthMethod();

      expect(result.hasPassword).toBe(false);
    });
  });

  describe('changePasswordAction - Validation', () => {
    it('should return validation errors for missing current password', async () => {
      const formData = new FormData();
      formData.append('currentPassword', '');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const result = await changePasswordAction({}, formData);

      expect(result.errors?.currentPassword).toBeDefined();
      expect(result.message).toBe('Please check your input');
    });

    it('should return validation errors for short new password', async () => {
      const formData = new FormData();
      formData.append('currentPassword', 'oldpassword');
      formData.append('newPassword', 'short');
      formData.append('confirmPassword', 'short');

      const result = await changePasswordAction({}, formData);

      expect(result.errors).toBeDefined();
      expect(result.message).toBe('Please check your input');
    });

    it('should return error when passwords do not match', async () => {
      const formData = new FormData();
      formData.append('currentPassword', 'oldpassword');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'differentpassword');

      const result = await changePasswordAction({}, formData);

      expect(result.success).toBeUndefined();
      expect(result.message).toBe('Passwords do not match');
      expect(result.errors).toBeDefined();
    });

    it('should return error when new password same as current', async () => {
      const formData = new FormData();
      formData.append('currentPassword', 'samepassword');
      formData.append('newPassword', 'samepassword');
      formData.append('confirmPassword', 'samepassword');

      const result = await changePasswordAction({}, formData);

      expect(result.success).toBeUndefined();
      expect(result.message).toContain('must be different');
      expect(result.errors).toBeDefined();
    });

    it('should return error when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('currentPassword', 'oldpassword');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const result = await changePasswordAction({}, formData);

      expect(result.success).toBeUndefined();
      expect(result.message).toBe('You must be logged in to change your password');
    });

    it('should return error for OAuth-only accounts', async () => {
      // Create test user without password
      await prisma.user.create({
        data: {
          id: mockUserId,
          email: mockEmail,
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      await prisma.account.create({
        data: {
          id: 'account-id',
          userId: mockUserId,
          providerId: 'github',
          accountId: 'github-123'
        }
      });

      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: mockUserId, email: mockEmail },
        session: { id: 'session-id', userId: mockUserId }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

      const formData = new FormData();
      formData.append('currentPassword', 'oldpassword');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const result = await changePasswordAction({}, formData);

      expect(result.success).toBeUndefined();
      expect(result.message).toContain('email/password accounts');
    });
  });

  describe('forgotPasswordAction - Validation', () => {
    it('should return validation errors for invalid email', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');

      const result = await forgotPasswordAction({}, formData);

      expect(result.errors?.email).toBeDefined();
      expect(result.errors?.email?.[0]).toContain('valid email');
      expect(result.message).toBe('Please enter a valid email address');
    });
  });

  describe('resetPasswordAction - Validation', () => {
    it('should return validation errors for short password', async () => {
      const formData = new FormData();
      formData.append('password', 'short');
      formData.append('confirmPassword', 'short');
      formData.append('token', 'valid-token');

      const result = await resetPasswordAction({}, formData);

      expect(result.errors?.password).toBeDefined();
      expect(result.errors?.password?.[0]).toContain('8 characters');
      expect(result.message).toBe('Please check your input');
    });

    it('should return error when passwords do not match', async () => {
      const formData = new FormData();
      formData.append('password', 'newpassword123');
      formData.append('confirmPassword', 'differentpassword');
      formData.append('token', 'valid-token');

      const result = await resetPasswordAction({}, formData);

      expect(result.success).toBeUndefined();
      expect(result.message).toBe('Passwords do not match');
    });

    it('should return validation error for missing token', async () => {
      const formData = new FormData();
      formData.append('password', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');
      formData.append('token', '');

      const result = await resetPasswordAction({}, formData);

      expect(result.success).toBeUndefined();
      // Empty token fails validation
      expect(result.message).toBe('Please check your input');
    });
  });
});
