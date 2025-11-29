/**
 * @module prisma
 * @description Unified Prisma client for database operations with environment-based schema selection.
 * Provides a singleton Prisma client that switches between MySQL (production/development)
 * and SQLite (CI/test) based on environment variables.
 *
 * @dependencies
 * - ../../prisma-main/types/client: MySQL schema types (production/development)
 * - ../../prisma-e2e/types/client: SQLite schema types (CI/test)
 * - @prisma/adapter-mariadb: MySQL/MariaDB driver adapter
 * - @prisma/adapter-libsql: SQLite driver adapter
 *
 * @remarks
 * - Both schemas are identical in structure, only the database engine differs
 * - In CI environment, uses SQLite with LibSQL adapter for faster, isolated testing
 * - In production/development, uses MySQL/MariaDB with MariaDB adapter
 * - Singleton pattern prevents multiple instances in hot-reload during development
 * - Re-exports all Prisma types from prisma-main for consistent imports
 *
 * @important
 * ALWAYS import Prisma types from this module, never directly from schema directories:
 * ```ts
 * // ✅ Correct
 * import prisma, { type Note, type User } from '@/lib/prisma';
 *
 * // ❌ Wrong - Do not import from schema directories
 * import { type Note } from '@prisma/client';
 * import { type Note } from '../../prisma-main/types/client';
 * ```
 *
 * @example
 * ```ts
 * import prisma, { type Note } from '@/lib/prisma';
 *
 * // Create a note
 * const note = await prisma.note.create({
 *   data: {
 *     noteId: 1,
 *     name: 'My Note',
 *     content: 'Hello world',
 *     userId: 'user123'
 *   }
 * });
 *
 * // Query notes
 * const notes = await prisma.note.findMany({
 *   where: { userId: 'user123' }
 * });
 * ```
 */

import { PrismaClient as mainClient } from '../../prisma-main/types/client';
import { PrismaClient as e2eClient } from '../../prisma-e2e/types/client';
import { prismaAdapter } from 'better-auth/adapters/prisma';

/**
 * Re-export ALL Prisma types from prisma-main.
 * Both schemas are identical, so we use prisma-main as the source of truth.
 *
 * @remarks
 * This ensures type consistency across the application regardless of which
 * database engine is used at runtime.
 */
export * from '../../prisma-main/types/client';

/**
 * Creates a Prisma client for MySQL database (production/development).
 * Uses MariaDB adapter for MySQL connections.
 *
 * @returns {mainClient} Prisma client instance for MySQL
 */

import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const getPrismaMain = () => {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string);
  return new mainClient({ adapter });
};

/**
 * Creates a Prisma client for SQLite database (CI/test).
 * Uses LibSQL adapter for SQLite connections.
 *
 * @returns {e2eClient} Prisma client instance for SQLite
 */

import { PrismaLibSql } from '@prisma/adapter-libsql';
import { DB_FILE } from '@/test/constants';

export const getPrismaE2E = () => {
  const adapter = new PrismaLibSql({
    url: process.env.DB_FILE ?? `file:./${DB_FILE}`
  });
  return new e2eClient({ adapter });
};

/**
 * Selects appropriate Prisma client based on environment.
 *
 * @returns {mainClient | e2eClient} Prisma client instance
 *
 * @remarks
 * - In CI environment (CI=true): uses SQLite
 * - In production/development: uses MySQL
 */
const getPrisma = () => (process.env.CI ? getPrismaE2E() : getPrismaMain());

/**
 * Global object type extension for Prisma singleton storage.
 *
 * @remarks
 * This prevents creating multiple Prisma instances during hot-reload in development.
 */
const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof getPrisma>;
};

/**
 * Singleton Prisma client instance.
 * Automatically switches between MySQL and SQLite based on environment.
 *
 * @constant {mainClient | e2eClient} prisma - Unified Prisma client
 *
 * @remarks
 * - In development: stored globally to persist across hot-reloads
 * - In production: created once per server instance
 * - In CI: uses SQLite for isolated, fast testing
 *
 * @example
 * ```ts
 * import prisma from '@/lib/prisma';
 *
 * // All Prisma operations work identically regardless of database engine
 * const users = await prisma.user.findMany();
 * const note = await prisma.note.create({ data: {...} });
 * ```
 */
const prisma = globalForPrisma.prisma || getPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Better Auth Prisma adapter configured with correct provider.
 * Automatically detects SQLite (CI) vs MySQL (production/dev) at runtime.
 *
 * @constant {ReturnType<typeof prismaAdapter>} authPrismaAdapter
 *
 * @remarks
 * - Provider detection happens at runtime to avoid webpack optimization issues
 * - Ensures Better Auth uses the correct SQL dialect for the active database
 * - Use this in Better Auth configuration instead of creating adapter inline
 *
 * @example
 * ```ts
 * import { authPrismaAdapter } from '@/lib/prisma';
 * import { betterAuth } from 'better-auth';
 *
 * export const auth = betterAuth({
 *   database: authPrismaAdapter,
 *   // ... other config
 * });
 * ```
 */
export const authPrismaAdapter = prismaAdapter(prisma, {
  provider: process.env.CI ? 'sqlite' : 'mysql',
  usePlural: false
});

export default prisma;
