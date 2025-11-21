/**
 * @file prisma.config.ts
 * @description Prisma configuration with environment-aware schema selection
 *
 * Configuration switches between MySQL (production/dev) and SQLite (CI/test):
 * - CI=true: Uses SQLite schema (prisma-e2e/schema.prisma) for testing
 * - Otherwise: Uses MySQL schema (prisma-main/schema.prisma) for production/development
 *
 * Database URLs are configured via environment variables (DATABASE_URL) or
 * DB_FILE for test environments.
 */
import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Datasource configuration - switches between SQLite (CI) and MySQL (prod/dev)
  datasource:
    process.env.CI === 'true'
      ? {
          // SQLite configuration for CI/test environment
          url: process.env.DB_FILE ? process.env.DB_FILE : 'file:./prisma-main/test.db'
        }
      : {
          // MySQL/MariaDB configuration for production/development
          url: env('DATABASE_URL'),
          shadowDatabaseUrl: env('SHADOW_DATABASE_URL')
        },
  // Schema selection - conditionally loads MySQL or SQLite schema
  schema: path.join(process.env.CI ? 'prisma-e2e' : 'prisma-main', 'schema.prisma')
});
