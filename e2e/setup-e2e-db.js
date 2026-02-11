#!/usr/bin/env node

/**
 * E2E Test Database Setup Script
 *
 * Prepares SQLite database for Playwright E2E tests.
 *
 * Steps:
 * 1. Cleans up existing test database and .next cache
 * 2. Generates Prisma Client for SQLite (prisma-e2e/types)
 * 3. Creates test database using prisma db push
 *
 * Note: CI=true is required for prisma.config.ts to select the
 * correct schema (prisma-e2e/schema.prisma)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '../prisma-e2e/test.db');
const nextDir = path.join(__dirname, '../.next');

if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
  console.log('Removed existing E2E test database');
}

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('Removed .next cache directory');
}

const dbUrl = `file:${dbFile}`;

console.log('Generating Prisma client for E2E tests (SQLite)...');
// CI=true and E2E_TEST=true required to select prisma-e2e/schema.prisma in prisma.config.ts
execSync('npx prisma generate --schema=prisma-e2e/schema.prisma', {
  stdio: 'inherit',
  env: { ...process.env, CI: true, E2E_TEST: true }
});

console.log('Creating E2E test database...');
// CI=true and E2E_TEST=true required to select prisma-e2e/schema.prisma in prisma.config.ts
execSync('npx prisma db push --schema=prisma-e2e/schema.prisma', {
  stdio: 'inherit',
  env: { ...process.env, CI: true, E2E_TEST: true }
});

console.log('E2E test database ready');
