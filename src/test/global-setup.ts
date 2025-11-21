import fs from 'fs';
import { execSync } from 'child_process';
import {
  SCHEMA_PATH,
  TEMPLATE_DB_FILE,
  TEMPLATE_DB_PATH,
  TEST_DB_PATH,
  TEST_DB_JOURNAL_PATH
} from './constants';

/**
 * Vitest global setup for database testing
 *
 * Creates a template SQLite database used for fast test initialization.
 *
 * Process:
 * 1. Deletes existing template database
 * 2. Runs prisma db push with TEMPLATE_DB_FILE env to create template database
 * 3. Template database is copied for each test suite (see setup-db.ts)
 */

export async function setup() {
  console.log('Creating template database for integration tests...');

  if (fs.existsSync(TEMPLATE_DB_PATH)) {
    fs.unlinkSync(TEMPLATE_DB_PATH);
  }

  // Use TEMPLATE_DB_FILE environment variable for database path
  // prisma.config.ts reads TEMPLATE_DB_FILE when CI=true to determine database location
  execSync(`npx prisma db push --schema=${SCHEMA_PATH}`, {
    stdio: 'pipe',
    env: {
      ...process.env,
      DB_FILE: `file:./${TEMPLATE_DB_FILE}`
    },
    encoding: 'utf-8'
  });

  if (!fs.existsSync(TEMPLATE_DB_PATH)) {
    throw new Error(`Template database was not created at ${TEMPLATE_DB_PATH}`);
  }

  console.log('Template database created successfully');
}

export async function teardown() {
  // Clean up test database and all related files
  const filesToClean = [
    TEST_DB_PATH,
    TEST_DB_JOURNAL_PATH,
    `${TEST_DB_PATH}-wal`,
    `${TEST_DB_PATH}-shm`
  ];

  for (const filePath of filesToClean) {
    if (fs.existsSync(filePath)) {
      try {
        // Ensure file is writable before deletion
        fs.chmodSync(filePath, 0o666);
        fs.unlinkSync(filePath);
      } catch (error) {
        // Ignore errors during cleanup
        console.warn(`Failed to clean up ${filePath}:`, error);
      }
    }
  }

  console.log('Cleaned up integration test database');
}
