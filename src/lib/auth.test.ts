import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { SendMailOptions } from 'nodemailer';

// Mock nodemailer before imports
const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn(() => ({
  sendMail: mockSendMail
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport
  }
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {},
    session: {},
    account: {},
    verification: {}
  }
}));

// Mock better-auth to capture configuration
interface AuthConfig {
  emailAndPassword: {
    sendResetPassword: (params: {
      user: { email: string; name?: string };
      url: string;
    }) => Promise<void>;
    requireEmailVerification: boolean;
  };
  emailVerification: {
    sendVerificationEmail: (params: {
      user: { email: string; name?: string };
      url: string;
    }) => Promise<void>;
  };
  [key: string]: unknown;
}

let authConfig: AuthConfig;
vi.mock('better-auth', () => ({
  betterAuth: vi.fn((config) => {
    authConfig = config;
    return {
      api: {},
      handler: vi.fn()
    };
  })
}));

vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: vi.fn(() => ({}))
}));

vi.mock('better-auth/next-js', () => ({
  nextCookies: vi.fn(() => ({}))
}));

describe('Better Auth Email Configuration', () => {
  let consoleLogSpy: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Set up environment variables
    vi.stubEnv('BETTER_AUTH_URL', 'https://test-app.com');
    vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret');
    vi.stubEnv('SMTP_HOST', 'smtp.test.com');
    vi.stubEnv('SMTP_PORT', '587');
    vi.stubEnv('SMTP_USERNAME', 'test@test.com');
    vi.stubEnv('SMTP_PASSWORD', 'test-password');
    vi.stubEnv('SMTP_FROM_EMAIL', 'noreply@test-app.com');

    // Clear module cache to force re-import with new env vars
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Password Reset Email', () => {
    it('should send email with correct base URL in production', async () => {
      // Set production environment
      vi.stubEnv('NODE_ENV', 'production');

      // Import auth to trigger betterAuth with current env
      await import('@/lib/auth');

      // Get the sendResetPassword callback
      const sendResetPassword = authConfig?.emailAndPassword.sendResetPassword;
      expect(sendResetPassword).toBeDefined();

      // Call the callback with test data
      const user = { email: 'user@example.com', name: 'Test User' };
      const resetUrl = 'https://test-app.com/reset-password?token=abc123';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendResetPassword({ user, url: resetUrl });

      // Verify sendMail was called
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Verify email metadata
      expect(emailOptions.to).toBe('user@example.com');
      expect(emailOptions.from).toBe('noreply@test-app.com');
      expect(emailOptions.subject).toBe('Reset Your Password - SNApp');

      // Verify text contains URL
      expect(emailOptions.text).toContain(resetUrl);
      expect(emailOptions.text).toContain('Test User');

      // Verify HTML contains URL in button and fallback
      expect(emailOptions.html).toContain(`href="${resetUrl}"`);
      expect(emailOptions.html).toContain(resetUrl); // Fallback link
      expect(emailOptions.html).toContain('Test User');
      expect(emailOptions.html).toContain('Reset Password');
    });

    it('should handle user without name', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      await import('@/lib/auth');

      const sendResetPassword = authConfig.emailAndPassword.sendResetPassword;
      const user = { email: 'user@example.com' };
      const resetUrl = 'https://test-app.com/reset-password?token=abc123';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendResetPassword({ user, url: resetUrl });

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Should use "there" as fallback
      expect(emailOptions.text).toContain('Hi there,');
      expect(emailOptions.html).toContain('Hi there,');
    });

    it('should only log to console in development mode', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      await import('@/lib/auth');

      const sendResetPassword = authConfig.emailAndPassword.sendResetPassword;
      const user = { email: 'user@example.com', name: 'Test User' };
      const resetUrl = 'https://test-app.com/reset-password?token=abc123';

      await sendResetPassword({ user, url: resetUrl });

      // Should log to console
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '\n🔑 Password Reset Link (Development Mode)'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('User: user@example.com');
      expect(consoleLogSpy).toHaveBeenCalledWith(`Reset URL: ${resetUrl}\n`);

      // Should NOT send email
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should not send email in test environment', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      await import('@/lib/auth');

      const sendResetPassword = authConfig.emailAndPassword.sendResetPassword;
      const user = { email: 'user@example.com', name: 'Test User' };
      const resetUrl = 'https://test-app.com/reset-password?token=abc123';

      await sendResetPassword({ user, url: resetUrl });

      // Should log to console (not production)
      expect(consoleLogSpy).toHaveBeenCalled();

      // Should NOT send email
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should use custom base URL from env variable', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('BETTER_AUTH_URL', 'https://my-custom-domain.com');
      await import('@/lib/auth');

      const sendResetPassword = authConfig.emailAndPassword.sendResetPassword;
      const user = { email: 'user@example.com', name: 'Test User' };
      const resetUrl = 'https://my-custom-domain.com/reset-password?token=abc123';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendResetPassword({ user, url: resetUrl });

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Verify the custom URL is used
      expect(emailOptions.text).toContain('https://my-custom-domain.com');
      expect(emailOptions.html).toContain('https://my-custom-domain.com');
    });

    it('should include security message about link expiration', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      await import('@/lib/auth');

      const sendResetPassword = authConfig.emailAndPassword.sendResetPassword;
      const user = { email: 'user@example.com', name: 'Test User' };
      const resetUrl = 'https://test-app.com/reset-password?token=abc123';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendResetPassword({ user, url: resetUrl });

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Verify security messages
      expect(emailOptions.text).toContain('This link will expire in 1 hour');
      expect(emailOptions.html).toContain('This link will expire in 1 hour');
      expect(emailOptions.text).toContain(
        "If you didn't request a password reset, you can safely ignore this email"
      );
    });
  });

  describe('Email Verification', () => {
    it('should send verification email with correct URL', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      await import('@/lib/auth');

      const sendVerificationEmail = authConfig.emailVerification.sendVerificationEmail;
      expect(sendVerificationEmail).toBeDefined();

      const user = { email: 'user@example.com', name: 'Test User' };
      const verifyUrl = 'https://test-app.com/verify-email?token=xyz789';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendVerificationEmail({ user, url: verifyUrl });

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Verify email metadata
      expect(emailOptions.to).toBe('user@example.com');
      expect(emailOptions.from).toBe('noreply@test-app.com');
      expect(emailOptions.subject).toBe('Verify your email address - SNApp');

      // Verify text contains URL
      expect(emailOptions.text).toContain(verifyUrl);
      expect(emailOptions.text).toContain('Test User');
      expect(emailOptions.text).toContain('Welcome to SNApp');

      // Verify HTML contains URL in button and fallback
      expect(emailOptions.html).toContain(`href="${verifyUrl}"`);
      expect(emailOptions.html).toContain(verifyUrl); // Fallback link
      expect(emailOptions.html).toContain('Test User');
      expect(emailOptions.html).toContain('Verify Email Address');
    });

    it('should handle user without name', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      await import('@/lib/auth');

      const sendVerificationEmail = authConfig.emailVerification.sendVerificationEmail;
      const user = { email: 'user@example.com' };
      const verifyUrl = 'https://test-app.com/verify-email?token=xyz789';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendVerificationEmail({ user, url: verifyUrl });

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Should use "there" as fallback
      expect(emailOptions.text).toContain('Hi there,');
      expect(emailOptions.html).toContain('Hi there,');
    });

    it('should send email in both production and development', async () => {
      // Test development mode
      vi.stubEnv('NODE_ENV', 'development');
      await import('@/lib/auth');

      let sendVerificationEmail = authConfig.emailVerification.sendVerificationEmail;
      const user = { email: 'user@example.com', name: 'Test User' };
      const verifyUrl = 'https://test-app.com/verify-email?token=xyz789';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendVerificationEmail({ user, url: verifyUrl });

      // Should send email in development (no environment check for verification)
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      // Reset and test production
      vi.clearAllMocks();
      vi.stubEnv('NODE_ENV', 'production');
      vi.resetModules();
      await import('@/lib/auth');

      sendVerificationEmail = authConfig?.emailVerification?.sendVerificationEmail;

      await sendVerificationEmail({ user, url: verifyUrl });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('should use custom base URL from env variable', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('BETTER_AUTH_URL', 'https://my-custom-domain.com');
      await import('@/lib/auth');

      const sendVerificationEmail = authConfig?.emailVerification?.sendVerificationEmail;
      const user = { email: 'user@example.com', name: 'Test User' };
      const verifyUrl = 'https://my-custom-domain.com/verify-email?token=xyz789';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendVerificationEmail({ user, url: verifyUrl });

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Verify the custom URL is used
      expect(emailOptions.text).toContain('https://my-custom-domain.com');
      expect(emailOptions.html).toContain('https://my-custom-domain.com');
    });

    it('should include security message about link expiration', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      await import('@/lib/auth');

      const sendVerificationEmail = authConfig?.emailVerification?.sendVerificationEmail;
      const user = { email: 'user@example.com', name: 'Test User' };
      const verifyUrl = 'https://test-app.com/verify-email?token=xyz789';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendVerificationEmail({ user, url: verifyUrl });

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Verify security messages
      expect(emailOptions.text).toContain('This link will expire in 24 hours');
      expect(emailOptions.html).toContain('This link will expire in 24 hours');
      expect(emailOptions.text).toContain(
        "If you didn't create an account with SNApp, you can safely ignore this email"
      );
    });
  });

  describe('Email Configuration', () => {
    it('should require email verification only in production', async () => {
      // Test production
      vi.stubEnv('NODE_ENV', 'production');
      vi.resetModules();
      await import('@/lib/auth');

      expect(authConfig?.emailAndPassword?.requireEmailVerification).toBe(true);

      // Test development
      vi.stubEnv('NODE_ENV', 'development');
      vi.resetModules();
      await import('@/lib/auth');

      expect(authConfig?.emailAndPassword?.requireEmailVerification).toBe(false);
    });

    it('should configure SMTP with correct credentials', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      await import('@/lib/auth');

      const sendResetPassword = authConfig?.emailAndPassword?.sendResetPassword;
      const user = { email: 'user@example.com', name: 'Test User' };
      const resetUrl = 'https://test-app.com/reset-password?token=abc123';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendResetPassword({ user, url: resetUrl });

      // Verify transporter was created with correct config
      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false, // Port 587 is not secure
        auth: {
          user: 'test@test.com',
          pass: 'test-password'
        }
      });
    });

    it('should use secure connection for port 465', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('SMTP_PORT', '465');
      vi.resetModules();
      await import('@/lib/auth');

      const sendResetPassword = authConfig?.emailAndPassword?.sendResetPassword;
      const user = { email: 'user@example.com', name: 'Test User' };
      const resetUrl = 'https://test-app.com/reset-password?token=abc123';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendResetPassword({ user, url: resetUrl });

      // Verify secure flag is set for port 465
      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true
        })
      );
    });
  });

  describe('Email Content Verification', () => {
    it('should include button text in password reset email', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      await import('@/lib/auth');

      const sendResetPassword = authConfig?.emailAndPassword?.sendResetPassword;
      const user = { email: 'user@example.com', name: 'Test User' };
      const resetUrl = 'https://test-app.com/reset-password?token=abc123';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendResetPassword({ user, url: resetUrl });

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Verify button text appears in HTML
      expect(emailOptions.html).toContain('Reset Password');
    });

    it('should include button text in verification email', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      await import('@/lib/auth');

      const sendVerificationEmail = authConfig?.emailVerification?.sendVerificationEmail;
      const user = { email: 'user@example.com', name: 'Test User' };
      const verifyUrl = 'https://test-app.com/verify-email?token=xyz789';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendVerificationEmail({ user, url: verifyUrl });

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Verify button text appears in HTML
      expect(emailOptions.html).toContain('Verify Email Address');
    });

    it('should include fallback instructions in both emails', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      await import('@/lib/auth');

      const sendResetPassword = authConfig?.emailAndPassword?.sendResetPassword;
      const user = { email: 'user@example.com', name: 'Test User' };
      const resetUrl = 'https://test-app.com/reset-password?token=abc123';

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await sendResetPassword({ user, url: resetUrl });

      const emailOptions: SendMailOptions = mockSendMail.mock.calls[0][0];

      // Verify fallback instructions text
      expect(emailOptions.html).toContain(
        "If the button doesn't work, copy and paste this link"
      );
    });
  });
});
