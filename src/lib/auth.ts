import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import prisma from '@/lib/prisma';

import { sendEmail } from '@/lib/email';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === 'production'
  },
  emailVerification: {
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
        text: 'Check HTML email',
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
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string
    }
  },
  database: prismaAdapter(prisma, {
    provider: process.env.NODE_ENV === 'test' ? 'sqlite' : 'mysql',
    usePlural: false
  })
});
