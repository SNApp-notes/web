import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { signUpAction, signInAction, signOutAction } from '@/app/actions/auth';

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn(),
      signOut: vi.fn()
    }
  }
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  })
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers())
}));

import { auth } from '@/lib/auth';

describe('Better Auth Integration', () => {
  let consoleErrorSpy: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('signUpAction', () => {
    it('should validate email format', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      formData.append('password', 'Password123!');
      formData.append('name', 'Test User');

      const result = await signUpAction({}, formData);

      expect(result.errors?.email).toBeDefined();
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should validate password length', async () => {
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'short');
      formData.append('name', 'Test User');

      const result = await signUpAction({}, formData);

      expect(result.errors?.password).toBeDefined();
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should validate name is required', async () => {
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'Password123!');
      formData.append('name', '');

      const result = await signUpAction({}, formData);

      expect(result.errors?.name).toBeDefined();
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should call Better Auth signUpEmail with correct data', async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue('{}')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      vi.mocked(auth.api.signUpEmail).mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'Password123!');
      formData.append('name', 'Test User');

      try {
        await signUpAction({}, formData);
      } catch (error) {
        expect((error as Error).message).toBe('REDIRECT:/');
      }

      expect(auth.api.signUpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: 'test@example.com',
            password: 'Password123!',
            name: 'Test User',
            callbackURL: '/'
          }
        })
      );
    });

    it('should handle Better Auth errors', async () => {
      const mockResponse = {
        ok: false,
        text: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ message: 'Email already exists' }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      vi.mocked(auth.api.signUpEmail).mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'Password123!');
      formData.append('name', 'Test User');

      const result = await signUpAction({}, formData);

      expect(result.message).toBe('Email already exists');
    });

    it('should handle response parsing errors', async () => {
      const mockResponse = {
        ok: false,
        text: vi.fn().mockRejectedValue(new Error('Failed to read response body'))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      vi.mocked(auth.api.signUpEmail).mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'Password123!');
      formData.append('name', 'Test User');

      const result = await signUpAction({}, formData);

      expect(
        result.message?.startsWith('An unexpected error occurred. Please try again.')
      ).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Sign up failed for user: test@example.com',
        expect.any(Error)
      );
    });
  });

  describe('signInAction', () => {
    it('should validate email format', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      formData.append('password', 'password');

      const result = await signInAction({}, formData);

      expect(result.errors?.email).toBeDefined();
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should validate password is required', async () => {
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', '');

      const result = await signInAction({}, formData);

      expect(result.errors?.password).toBeDefined();
      expect(result.message).toBe('Invalid fields. Please check your input.');
    });

    it('should call Better Auth signInEmail with correct data', async () => {
      const mockResponse = {
        ok: true,
        text: vi.fn().mockResolvedValue('{}')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      vi.mocked(auth.api.signInEmail).mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'Password123!');

      try {
        await signInAction({}, formData);
      } catch (error) {
        expect((error as Error).message).toBe('REDIRECT:/');
      }

      expect(auth.api.signInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: 'test@example.com',
            password: 'Password123!'
          }
        })
      );
    });

    it('should handle invalid credentials', async () => {
      const mockResponse = {
        ok: false,
        text: vi.fn().mockResolvedValue(JSON.stringify({ message: 'Invalid password' }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      vi.mocked(auth.api.signInEmail).mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'WrongPassword');

      const result = await signInAction({}, formData);

      expect(result.message).toBe('Invalid password');
    });

    it('should handle response parsing errors', async () => {
      const mockResponse = {
        ok: false,
        text: vi.fn().mockRejectedValue(new Error('Failed to read response body'))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      vi.mocked(auth.api.signInEmail).mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'Password123!');

      const result = await signInAction({}, formData);

      expect(result.message).toBe('An unexpected error occurred. Please try again.');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Sign in failed for user: test@example.com'
      );
    });
  });

  describe('signOutAction', () => {
    it('should call Better Auth signOut and redirect to login', async () => {
      vi.mocked(auth.api.signOut).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { success: true } as any
      );

      try {
        await signOutAction();
      } catch (error) {
        expect((error as Error).message).toBe('REDIRECT:/login');
      }

      expect(auth.api.signOut).toHaveBeenCalled();
    });

    it('should redirect to login even if signOut fails', async () => {
      vi.mocked(auth.api.signOut).mockRejectedValue(new Error('Session cleanup failed'));

      try {
        await signOutAction();
      } catch (error) {
        expect((error as Error).message).toBe('REDIRECT:/login');
      }

      expect(auth.api.signOut).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Sign out failed - session cleanup error'
      );
    });
  });
});
