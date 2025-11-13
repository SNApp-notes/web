/**
 * @module prisma
 * @description Unified Prisma client for database operations with environment-based schema selection.
 * Provides a singleton Prisma client that switches between MySQL (production/development)
 * and SQLite (CI/test) based on environment variables.
 *
 * @dependencies
 * - ../../prisma-main/types: MySQL schema types (production/development)
 * - ../../prisma-e2e/types: SQLite schema types (CI/test)
 *
 * @remarks
 * - Both schemas are identical in structure, only the database engine differs
 * - In CI environment, uses SQLite for faster, isolated testing
 * - In production/development, uses MySQL for persistence and scalability
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
 * import { type Note } from '../../prisma-main/types';
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

import { PrismaClient as mainClient } from '../../prisma-main/types';
import { PrismaClient as e2eClient, Prisma } from '../../prisma-e2e/types';

/**
 * Re-export ALL Prisma types from prisma-main.
 * Both schemas are identical, so we use prisma-main as the source of truth.
 *
 * @remarks
 * This ensures type consistency across the application regardless of which
 * database engine is used at runtime.
 */
export * from '../../prisma-main/types';

/**
 * Prisma client options for logging configuration.
 *
 * @constant {Prisma.PrismaClientOptions} options
 * @property {string[]} log - Log levels: only errors and warnings
 *
 * @remarks
 * Logging is kept minimal to reduce noise in production.
 * Add 'query' and 'info' for development debugging if needed.
 */
const options: Prisma.PrismaClientOptions = {
  log: ['error', 'warn']
};

/**
 * Creates a Prisma client for MySQL database (production/development).
 *
 * @returns {mainClient} Prisma client instance for MySQL
 */
const getPrismaMain = () => new mainClient(options);

/**
 * Creates a Prisma client for SQLite database (CI/test).
 *
 * @returns {e2eClient} Prisma client instance for SQLite
 */
const getPrismaE2E = () => new e2eClient(options);

/**
 * Selects appropriate Prisma client based on environment.
 *
 * @returns {mainClient | e2eClient} Prisma client instance
 *
 * @remarks
 * - In CI environment (NODE_ENV=test or CI=true): uses SQLite
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
  prisma: ReturnType<typeof getPrismaMain>;
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

export default prisma;
