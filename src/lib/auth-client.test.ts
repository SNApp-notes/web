import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuthClient } from 'better-auth/react';

vi.mock('better-auth/react', () => ({
  createAuthClient: vi.fn((config) => ({
    $INTERNAL_baseURL: config.baseURL,
    signIn: { social: vi.fn() },
    signOut: vi.fn(),
    signUp: { email: vi.fn() },
    useSession: vi.fn()
  }))
}));

describe('auth-client', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL = originalEnv;
    global.window = originalWindow;
  });

  describe('baseURL configuration', () => {
    it('should use NEXT_PUBLIC_BETTER_AUTH_URL when set', async () => {
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL = 'https://example.com';

      await import('./auth-client');

      expect(createAuthClient).toHaveBeenCalledWith({
        baseURL: 'https://example.com'
      });
    });

    it('should use window.location.origin when env var not set and window is defined', async () => {
      delete process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://client-side.com'
          }
        },
        writable: true,
        configurable: true
      });

      await import('./auth-client');

      expect(createAuthClient).toHaveBeenCalledWith({
        baseURL: 'https://client-side.com'
      });
    });

    it('should fallback to http://localhost:3000 when env var not set and window is undefined', async () => {
      delete process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true
      });

      await import('./auth-client');

      expect(createAuthClient).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000'
      });
    });

    it('should prefer env var over window.location.origin', async () => {
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL = 'https://env-var.com';

      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://window-origin.com'
          }
        },
        writable: true,
        configurable: true
      });

      await import('./auth-client');

      expect(createAuthClient).toHaveBeenCalledWith({
        baseURL: 'https://env-var.com'
      });
    });
  });

  describe('exported utilities', () => {
    it('should export signIn, signOut, signUp, and useSession', async () => {
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL = 'https://example.com';

      const authClientModule = await import('./auth-client');

      expect(authClientModule.signIn).toBeDefined();
      expect(authClientModule.signOut).toBeDefined();
      expect(authClientModule.signUp).toBeDefined();
      expect(authClientModule.useSession).toBeDefined();
    });
  });
});
