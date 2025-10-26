import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { changePasswordAction, getUserAuthMethod } from '@/app/actions/auth';
import prisma from '@/lib/prisma';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers())
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      changePassword: vi.fn()
    }
  }
}));

describe('Password Change Functionality', () => {
  let testUserId: string;
  let testEmail: string;

  beforeEach(async () => {
    testEmail = `test-${Date.now()}@example.com`;

    const user = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        name: 'Test User',
        email: testEmail,
        emailVerified: true
      }
    });

    testUserId = user.id;

    await prisma.account.create({
      data: {
        id: `account-${Date.now()}`,
        accountId: testEmail,
        providerId: 'credential',
        userId: testUserId,
        password: 'hashed-password-placeholder'
      }
    });
  });

  afterEach(async () => {
    try {
      await prisma.account.deleteMany({
        where: { userId: testUserId }
      });
      await prisma.user.delete({
        where: { id: testUserId }
      });
    } catch (error) {
      // User may not exist if test didn't use it
    }
  });

  it('should detect email/password authentication method', async () => {
    const result = await getUserAuthMethod();

    expect(result).toBeDefined();
    expect(result.hasPassword).toBeDefined();
  });

  it('should validate password change input fields', async () => {
    const formData = new FormData();
    formData.set('currentPassword', '');
    formData.set('newPassword', 'short');
    formData.set('confirmPassword', 'short');

    const result = await changePasswordAction({}, formData);

    expect(result.errors).toBeDefined();
    expect(result.success).toBeUndefined();
  });

  it('should reject mismatched password confirmation', async () => {
    const formData = new FormData();
    formData.set('currentPassword', 'oldpassword123');
    formData.set('newPassword', 'newpassword123');
    formData.set('confirmPassword', 'different123');

    const result = await changePasswordAction({}, formData);

    expect(result.errors).toBeDefined();
    expect(result.errors && 'confirmPassword' in result.errors).toBe(true);
    expect(result.message).toContain('do not match');
  });

  it('should reject same password as current', async () => {
    const formData = new FormData();
    formData.set('currentPassword', 'password123');
    formData.set('newPassword', 'password123');
    formData.set('confirmPassword', 'password123');

    const result = await changePasswordAction({}, formData);

    expect(result.errors).toBeDefined();
    expect(result.errors && 'newPassword' in result.errors).toBe(true);
    expect(result.message).toContain('must be different');
  });

  it('should require minimum password length', async () => {
    const formData = new FormData();
    formData.set('currentPassword', 'oldpass');
    formData.set('newPassword', 'short');
    formData.set('confirmPassword', 'short');

    const result = await changePasswordAction({}, formData);

    expect(result.errors).toBeDefined();
    if (result.errors && 'newPassword' in result.errors) {
      expect(result.errors.newPassword?.[0]).toContain('8 characters');
    }
  });
});
