/**
 * @file prisma.config.ts
 * @description Prisma configuration with environment-aware schema selection
 *
 * Configuration switches between MySQL (production/dev) and SQLite (CI/test):
 * - CI=true AND E2E_TEST=true: Uses SQLite schema (prisma-e2e/schema.prisma) for testing
 * - Otherwise: Uses MySQL schema (prisma-main/schema.prisma) for production/development
 *
 * Database URLs are configured via environment variables (DATABASE_URL) or
 * DB_FILE for test environments.
 *
 * Note: Vercel sets CI=true by default, but we only want SQLite for actual E2E tests,
 * so we check for both CI=true AND E2E_TEST=true.
 */
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig(
  process.env.CI && process.env.E2E_TEST
    ? {
        schema: 'prisma-e2e/schema.prisma',
        migrations: {
          path: 'prisma-e2e/migrations',
          seed: 'tsx prisma-e2e/seed.ts'
        },
        datasource: {
          url: process.env.DB_FILE ? process.env.DB_FILE : 'file:./prisma-e2e/test.db'
        }
      }
    : {
        schema: 'prisma-main/schema.prisma',
        migrations: {
          path: 'prisma-main/migrations',
          seed: 'tsx prisma-main/seed.ts'
        },
        datasource: {
          url: env('DATABASE_URL'),
          shadowDatabaseUrl: env('SHADOW_DATABASE_URL')
        }
      }
);
