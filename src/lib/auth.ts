/**
 * @module auth
 * @description Server-side authentication configuration using Better Auth.
 * Provides email/password authentication, OAuth (GitHub), email verification,
 * password reset, and automatic welcome note creation for new users.
 *
 * @dependencies
 * - better-auth: Authentication framework
 * - @/lib/prisma: Database client
 * - @/lib/email: Email service for verification and password reset
 *
 * @remarks
 * - Email verification is required in production, disabled in development
 * - In development mode, password reset links are logged to console
 * - Database adapter switches between MySQL (prod/dev) and SQLite (CI)
 * - Creates a welcome note for each new user on first account creation
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';

import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

/**
 * Authentication instance configured with Better Auth.
 *
 * @constant {Object} auth - Better Auth instance
 *
 * @property {string} baseURL - Base URL from BETTER_AUTH_URL environment variable
 * @property {string} secret - Secret key from BETTER_AUTH_SECRET environment variable
 * @property {Object} emailAndPassword - Email/password authentication configuration
 * @property {boolean} emailAndPassword.requireEmailVerification - Requires email verification in production only
 * @property {Object} emailVerification - Email verification configuration
 * @property {boolean} emailVerification.autoSignInAfterVerification - Automatically signs in user after email verification
 * @property {Object} socialProviders - OAuth provider configuration (GitHub)
 * @property {Object} databaseHooks - Lifecycle hooks for database operations
 * @property {Object} database - Prisma database adapter configuration
 *
 * @example
 * // In server components or API routes
 * import { auth } from '@/lib/auth';
 *
 * const session = await auth.api.getSession({ headers: await headers() });
 * if (session?.user) {
 *   console.log('User is authenticated:', session.user.email);
 * }
 *
 * @remarks
 * - GitHub OAuth is only enabled if GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set
 * - Database hooks create a welcome note for new users on first account creation
 * - Email verification and password reset use different logic in development vs production
 * - Telemetry is disabled for privacy
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  plugins: [nextCookies()],
  databaseHooks: {
    account: {
      create: {
        after: async (account) => {
          // Create welcome note for all new users (OAuth and email/password)
          try {
            // Direct database interaction - no session needed
            await prisma.$transaction(async (tx) => {
              // Check if user already has any notes
              const existingNotes = await tx.note.findMany({
                where: { userId: account.userId }
              });

              // Only create welcome note if this is their first account/note
              if (existingNotes.length === 0) {
                await tx.note.create({
                  data: {
                    noteId: 1, // First note for this user
                    name: 'Welcome to SNApp',
                    content: null, // null triggers display of /public/samples/welcome.md
                    userId: account.userId
                  }
                });
              }
            });
          } catch (error) {
            console.error('Error creating welcome note for new user:', error);
            // Don't throw - this shouldn't break the auth flow
          }
        }
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === 'production',
    sendResetPassword: async ({
      user,
      url
    }: {
      user: { email: string; name?: string };
      url: string;
    }) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n🔑 Password Reset Link (Development Mode)');
        console.log(`User: ${user.email}`);
        console.log(`Reset URL: ${url}\n`);
        return;
      }

      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password - SNApp',
        text: `
Hi ${user.name || 'there'},

We received a request to reset your password. Click the link below to create a new password:

${url}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        `.trim(),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2D3748; text-align: center;">Reset Your Password</h1>
            <p style="color: #4A5568; font-size: 16px;">
              Hi ${user.name || 'there'},
            </p>
            <p style="color: #4A5568; font-size: 16px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="background-color: #3182CE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #718096; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #718096; font-size: 14px; word-break: break-all;">
              ${url}
            </p>
            <p style="color: #718096; font-size: 14px;">
              This link will expire in 1 hour for security reasons.
            </p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0;">
            <p style="color: #A0AEC0; font-size: 12px; text-align: center;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        `
      });
    }
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({
      user,
      url
    }: {
      user: { email: string; name?: string };
      url: string;
    }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email address - SNApp',
        text: `
Hi ${user.name || 'there'},

Welcome to SNApp! Thank you for signing up.

Please verify your email address by clicking the link below:

${url}

This link will expire in 24 hours for security reasons.

If you didn't create an account with SNApp, you can safely ignore this email.
        `.trim(),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2D3748; text-align: center;">Welcome to SNApp!</h1>
            <p style="color: #4A5568; font-size: 16px;">
              Hi ${user.name || 'there'},
            </p>
            <p style="color: #4A5568; font-size: 16px;">
              Thank you for signing up! Please verify your email address by clicking the button below:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="background-color: #3182CE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #718096; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #718096; font-size: 14px; word-break: break-all;">
              ${url}
            </p>
            <p style="color: #718096; font-size: 14px;">
              This link will expire in 24 hours for security reasons.
            </p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0;">
            <p style="color: #A0AEC0; font-size: 12px; text-align: center;">
              If you didn't create an account with SNApp, you can safely ignore this email.
            </p>
          </div>
        `
      });
    }
  },
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        socialProviders: {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET
          }
        }
      }
    : {}),
  database: prismaAdapter(prisma, {
    provider: process.env.CI ? 'sqlite' : 'mysql',
    usePlural: false
  }),
  telemetry: {
    enabled: false
  }
});
