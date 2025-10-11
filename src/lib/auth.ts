import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '@/lib/prisma';
import { socialProviders } from 'better-auth/social-providers';

export const auth = betterAuth({
  providers: [
    socialProviders.github({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string
    })
  ],
  database: prismaAdapter(prisma, {
    provider: 'mysql'
  })
});
