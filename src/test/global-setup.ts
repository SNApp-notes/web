import fs from 'fs';
import { execSync } from 'child_process';
import {
  SCHEMA_PATH,
  TEMP_SCHEMA_PATH,
  TEMPLATE_DB_PATH,
  TEST_DB_PATH,
  TEST_DB_JOURNAL_PATH
} from './constants';

export async function setup() {
  console.log('Creating template database for integration tests...');

  if (fs.existsSync(TEMPLATE_DB_PATH)) {
    fs.unlinkSync(TEMPLATE_DB_PATH);
  }

  const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const modifiedSchema = schemaContent.replace(
    'url      = "file:./test.db"',
    'url      = "file:./template.db"'
  );

  fs.writeFileSync(TEMP_SCHEMA_PATH, modifiedSchema);

  try {
    execSync(`npx prisma db push --skip-generate --schema=${TEMP_SCHEMA_PATH}`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });

    if (!fs.existsSync(TEMPLATE_DB_PATH)) {
      throw new Error(`Template database was not created at ${TEMPLATE_DB_PATH}`);
    }

    console.log('Template database created successfully');
  } finally {
    if (fs.existsSync(TEMP_SCHEMA_PATH)) {
      fs.unlinkSync(TEMP_SCHEMA_PATH);
    }
  }
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
