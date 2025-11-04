import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store original env values
const originalEnv = { ...process.env };

// Mock nodemailer
vi.mock('nodemailer', () => {
  const mockSendMail = vi.fn();
  const mockTransport = {
    sendMail: mockSendMail
  };
  const mockCreateTransport = vi.fn(() => mockTransport);

  return {
    default: {
      createTransport: mockCreateTransport
    },
    __mockInstances: {
      sendMail: mockSendMail,
      createTransport: mockCreateTransport
    }
  };
});

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers())
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    verification: {
      create: vi.fn().mockResolvedValue({ id: 'test-verification-id' }),
      findUnique: vi.fn(),
      delete: vi.fn()
    },
    account: {
      findFirst: vi.fn()
    },
    $transaction: vi.fn((callback) =>
      callback({
        note: {
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn()
        }
      })
    )
  }
}));

// Mock Better Auth
vi.mock('@/lib/auth', () => {
  const mockGetSession = vi.fn();
  const mockForgetPassword = vi.fn();
  const mockVerifyEmail = vi.fn();

  return {
    auth: {
      api: {
        getSession: mockGetSession,
        forgetPassword: mockForgetPassword,
        verifyEmail: mockVerifyEmail
      },
      emailAndPassword: {
        sendResetPassword: vi.fn()
      },
      emailVerification: {
        sendVerificationEmail: vi.fn()
      }
    },
    __mockInstances: {
      getSession: mockGetSession,
      forgetPassword: mockForgetPassword,
      verifyEmail: mockVerifyEmail
    }
  };
});

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  requestAccountDeletionAction,
  forgotPasswordAction,
  verifyEmailAction
} from '@/app/actions/auth';
import { auth } from '@/lib/auth';
import type { User, Session } from '@/lib/prisma';

// Type for Better Auth session response
type AuthSession = {
  user: Pick<User, 'id' | 'email' | 'name' | 'emailVerified' | 'createdAt' | 'updatedAt'>;
  session: Pick<
    Session,
    'id' | 'expiresAt' | 'token' | 'createdAt' | 'updatedAt' | 'userId'
  >;
};

// Create a reference to the sendMail mock that will be created by nodemailer.createTransport
let mockSendMail = vi.fn();

// Override createTransport to capture sendMail reference
vi.mocked(nodemailer.createTransport).mockImplementation(() => {
  mockSendMail = vi.fn();
  return {
    sendMail: mockSendMail
  } as unknown as Transporter<SMTPTransport.SentMessageInfo>;
});

// Get references to the auth mocks
const mockGetSession = vi.mocked(auth.api.getSession);
const mockForgetPassword = vi.mocked(auth.api.forgetPassword);
const mockVerifyEmail = vi.mocked(auth.api.verifyEmail);
const mockCreateTransport = vi.mocked(nodemailer.createTransport);

// Helper mock data
const createMockSession = (): Pick<
  Session,
  'id' | 'expiresAt' | 'token' | 'createdAt' | 'updatedAt' | 'userId'
> => ({
  id: 'session-123',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  token: 'test-token',
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 'user-123'
});

describe('Email Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockClear();
    mockCreateTransport.mockClear();
    mockGetSession.mockClear();
    mockForgetPassword.mockClear();
    mockVerifyEmail.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Set NODE_ENV for email sending tests
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    // Restore original env
    vi.unstubAllEnvs();
    Object.keys(process.env).forEach((key) => {
      if (!originalEnv[key]) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe('Account Deletion Email', () => {
    const mockUser: Pick<
      User,
      'id' | 'email' | 'name' | 'createdAt' | 'updatedAt' | 'emailVerified'
    > = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true
    };

    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        user: mockUser,
        session: createMockSession()
      } as unknown as AuthSession);
    });

    it('should send account deletion email with correct domain from BETTER_AUTH_URL', async () => {
      process.env.BETTER_AUTH_URL = 'https://snapp.example.com';

      await requestAccountDeletionAction();

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const emailCall = mockSendMail.mock.calls[0][0];

      // Check email basics
      expect(emailCall.to).toBe('test@example.com');
      expect(emailCall.subject).toBe('Confirm Account Deletion - SNApp');

      // Check HTML contains correct URL
      expect(emailCall.html).toContain(
        'https://snapp.example.com/api/auth/delete-account?token='
      );

      // Check text version exists and contains correct URL
      expect(emailCall.text).toBeTruthy();
      expect(emailCall.text).toContain(
        'https://snapp.example.com/api/auth/delete-account?token='
      );
      expect(emailCall.text).toContain('Hi Test User');
      expect(emailCall.text).toContain('This action cannot be undone');
      expect(emailCall.text).toContain('This link will expire in 24 hours');
    });

    it('should use localhost as fallback when BETTER_AUTH_URL is not set', async () => {
      delete process.env.BETTER_AUTH_URL;

      await requestAccountDeletionAction();

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const emailCall = mockSendMail.mock.calls[0][0];

      expect(emailCall.html).toContain(
        'http://localhost:3000/api/auth/delete-account?token='
      );
      expect(emailCall.text).toContain(
        'http://localhost:3000/api/auth/delete-account?token='
      );
    });

    it('should work with custom production domain', async () => {
      process.env.BETTER_AUTH_URL = 'https://notes.company.io';

      await requestAccountDeletionAction();

      const emailCall = mockSendMail.mock.calls[0][0];

      expect(emailCall.html).toContain(
        'https://notes.company.io/api/auth/delete-account?token='
      );
      expect(emailCall.text).toContain(
        'https://notes.company.io/api/auth/delete-account?token='
      );
    });

    it('should include all required information in text email', async () => {
      process.env.BETTER_AUTH_URL = 'https://snapp.example.com';

      await requestAccountDeletionAction();

      const emailCall = mockSendMail.mock.calls[0][0];
      const textContent = emailCall.text;

      // Check for key content in plain text version
      expect(textContent).toContain('Hi Test User');
      expect(textContent).toContain('account deletion');
      expect(textContent).toContain('Your account and profile information');
      expect(textContent).toContain('All your notes and content');
      expect(textContent).toContain('Your login sessions');
      expect(textContent).toContain('expire in 24 hours');
      expect(textContent).toContain('safely ignore this email');
    });

    it('should include all required information in HTML email', async () => {
      process.env.BETTER_AUTH_URL = 'https://snapp.example.com';

      await requestAccountDeletionAction();

      const emailCall = mockSendMail.mock.calls[0][0];
      const htmlContent = emailCall.html;

      // Check for key content in HTML version
      expect(htmlContent).toContain('Account Deletion Request');
      expect(htmlContent).toContain('Hi Test User');
      expect(htmlContent).toContain('Your account and profile information');
      expect(htmlContent).toContain('All your notes and content');
      expect(htmlContent).toContain('Your login sessions');
      expect(htmlContent).toContain('Permanently Delete My Account');
      expect(htmlContent).toContain('expire in 24 hours');
      expect(htmlContent).toContain('safely ignore this email');
    });

    it('should not send email in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      const result = await requestAccountDeletionAction();

      expect(mockSendMail).not.toHaveBeenCalled();
      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationUrl).toBeTruthy();
    });

    it('should handle user without email', async () => {
      mockGetSession.mockResolvedValue({
        user: { ...mockUser, email: '' },
        session: createMockSession()
      } as unknown as AuthSession);

      const result = await requestAccountDeletionAction();

      expect(mockSendMail).not.toHaveBeenCalled();
      expect(result.message).toBe('No email address found for your account');
    });

    it('should handle unauthenticated user', async () => {
      mockGetSession.mockResolvedValue(null);

      const result = await requestAccountDeletionAction();

      expect(mockSendMail).not.toHaveBeenCalled();
      expect(result.message).toBe('You must be logged in to delete your account');
    });

    it('should extract token from URL in both HTML and text', async () => {
      process.env.BETTER_AUTH_URL = 'https://snapp.example.com';

      await requestAccountDeletionAction();

      const emailCall = mockSendMail.mock.calls[0][0];

      // Extract token from HTML
      const htmlTokenMatch = emailCall.html.match(
        /https:\/\/snapp\.example\.com\/api\/auth\/delete-account\?token=([a-f0-9]+)/
      );
      expect(htmlTokenMatch).toBeTruthy();
      const htmlToken = htmlTokenMatch![1];
      expect(htmlToken).toMatch(/^[a-f0-9]{64}$/); // 32 bytes hex = 64 chars

      // Extract token from text
      const textTokenMatch = emailCall.text.match(
        /https:\/\/snapp\.example\.com\/api\/auth\/delete-account\?token=([a-f0-9]+)/
      );
      expect(textTokenMatch).toBeTruthy();
      const textToken = textTokenMatch![1];

      // Tokens should be the same in both versions
      expect(htmlToken).toBe(textToken);
    });
  });

  describe('Password Reset Email', () => {
    it('should send password reset email with correct domain from BETTER_AUTH_URL', async () => {
      process.env.BETTER_AUTH_URL = 'https://snapp.example.com';

      const formData = new FormData();
      formData.append('email', 'test@example.com');

      mockForgetPassword.mockResolvedValue({ status: true });

      await forgotPasswordAction({}, formData);

      expect(mockForgetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: 'test@example.com',
            redirectTo: 'https://snapp.example.com/reset-password'
          }
        })
      );
    });

    it('should use localhost as fallback when BETTER_AUTH_URL is not set', async () => {
      delete process.env.BETTER_AUTH_URL;

      const formData = new FormData();
      formData.append('email', 'test@example.com');

      mockForgetPassword.mockResolvedValue({ status: true });

      await forgotPasswordAction({}, formData);

      expect(mockForgetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: 'test@example.com',
            redirectTo: 'http://localhost:3000/reset-password'
          }
        })
      );
    });

    it('should work with custom production domain', async () => {
      process.env.BETTER_AUTH_URL = 'https://notes.company.io';

      const formData = new FormData();
      formData.append('email', 'test@example.com');

      mockForgetPassword.mockResolvedValue({ status: true });

      await forgotPasswordAction({}, formData);

      expect(mockForgetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            email: 'test@example.com',
            redirectTo: 'https://notes.company.io/reset-password'
          }
        })
      );
    });

    it('should validate email format', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');

      const result = await forgotPasswordAction({}, formData);

      expect(result.errors?.email).toBeDefined();
      expect(mockForgetPassword).not.toHaveBeenCalled();
    });
  });

  describe('Email Verification', () => {
    beforeEach(() => {
      // Reset NODE_ENV for email verification tests
      vi.stubEnv('NODE_ENV', 'test');
    });

    it('should verify email and handle Better Auth response', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          user: { id: 'user-123', email: 'test@example.com' }
        })
      };

      (mockVerifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse as unknown as Response
      );

      const result = await verifyEmailAction('test-token-123');

      expect(result.success).toBe(true);
      expect(mockVerifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            token: 'test-token-123'
          }
        })
      );
    });

    it('should handle expired verification token', async () => {
      const mockResponse = {
        ok: false,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            message: 'Verification token has expired'
          })
        )
      };

      (mockVerifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse as unknown as Response
      );

      const result = await verifyEmailAction('expired-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('This verification link has expired or is invalid');
      expect(result.isExpired).toBe(true);
    });

    it('should handle invalid verification token', async () => {
      const mockResponse = {
        ok: false,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            message: 'Token not found'
          })
        )
      };

      (mockVerifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse as unknown as Response
      );

      const result = await verifyEmailAction('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('This verification link has expired or is invalid');
      expect(result.isExpired).toBe(true);
    });
  });

  describe('Email Configuration', () => {
    it('should use correct SMTP settings from environment', async () => {
      process.env.BETTER_AUTH_URL = 'https://snapp.example.com';
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USERNAME = 'test@test.com';
      process.env.SMTP_PASSWORD = 'test-password';
      process.env.SMTP_FROM_EMAIL = 'noreply@test.com';

      mockGetSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        session: createMockSession()
      } as unknown as AuthSession);

      await requestAccountDeletionAction();

      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'test-password'
        }
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@test.com'
        })
      );
    });

    it('should use secure connection for port 465', async () => {
      process.env.SMTP_PORT = '465';
      process.env.BETTER_AUTH_URL = 'https://snapp.example.com';

      mockGetSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        session: createMockSession()
      } as unknown as AuthSession);

      await requestAccountDeletionAction();

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true
        })
      );
    });
  });

  describe('URL Consistency', () => {
    it('should ensure HTML and text emails contain identical URLs', async () => {
      const domains = [
        'https://snapp.example.com',
        'https://notes.company.io',
        'https://app.production.com'
      ];

      for (const domain of domains) {
        vi.clearAllMocks();
        mockSendMail.mockClear();
        mockGetSession.mockClear();
        process.env.BETTER_AUTH_URL = domain;

        mockGetSession.mockResolvedValue({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          session: createMockSession()
        } as unknown as AuthSession);

        await requestAccountDeletionAction();

        const emailCall = mockSendMail.mock.calls[0][0];

        // Extract URLs from both HTML and text
        const htmlUrlMatch = emailCall.html.match(
          new RegExp(
            `${domain.replace(/\./g, '\\.')}/api/auth/delete-account\\?token=([a-f0-9]+)`
          )
        );
        const textUrlMatch = emailCall.text.match(
          new RegExp(
            `${domain.replace(/\./g, '\\.')}/api/auth/delete-account\\?token=([a-f0-9]+)`
          )
        );

        expect(htmlUrlMatch).toBeTruthy();
        expect(textUrlMatch).toBeTruthy();
        expect(htmlUrlMatch![0]).toBe(textUrlMatch![0]);
      }
    });

    it('should use BETTER_AUTH_URL consistently across all email types', async () => {
      const testDomain = 'https://consistent.domain.com';
      process.env.BETTER_AUTH_URL = testDomain;

      // Test account deletion
      mockGetSession.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        session: createMockSession()
      } as unknown as AuthSession);

      await requestAccountDeletionAction();
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.html).toContain(testDomain);
      expect(emailCall.text).toContain(testDomain);

      vi.clearAllMocks();
      mockSendMail.mockClear();
      mockForgetPassword.mockClear();

      // Test password reset
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      mockForgetPassword.mockResolvedValue({ status: true });

      await forgotPasswordAction({}, formData);
      expect(mockForgetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            redirectTo: `${testDomain}/reset-password`
          })
        })
      );
    });
  });
});
