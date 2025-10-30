import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'fs';
import { PrismaClient as e2eClient } from '../../prisma-e2e/types';
import { TEMPLATE_DB_PATH, TEST_DB_PATH } from './constants';

let prisma: e2eClient;

vi.spyOn(console, 'log').mockImplementation(() => undefined);

export async function setupTestDatabase(): Promise<void> {
  process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

  if (!fs.existsSync(TEMPLATE_DB_PATH)) {
    throw new Error('Template database not found. Global setup may have failed.');
  }

  // Remove existing test database and any lock files
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (e) {
      // If deletion fails, try to change permissions first
      fs.chmodSync(TEST_DB_PATH, 0o666);
      fs.unlinkSync(TEST_DB_PATH);
    }
  }

  // Also remove any journal/WAL files that might exist
  const journalPath = `${TEST_DB_PATH}-journal`;
  const walPath = `${TEST_DB_PATH}-wal`;
  const shmPath = `${TEST_DB_PATH}-shm`;

  [journalPath, walPath, shmPath].forEach((path) => {
    if (fs.existsSync(path)) {
      try {
        fs.unlinkSync(path);
      } catch (e) {
        // Ignore errors when cleaning up lock files
      }
    }
  });

  // Copy template database
  fs.copyFileSync(TEMPLATE_DB_PATH, TEST_DB_PATH);

  // Ensure the copied file has write permissions (0666 = rw-rw-rw-)
  fs.chmodSync(TEST_DB_PATH, 0o666);

  prisma = new e2eClient();
}

export async function cleanDatabase(): Promise<void> {
  try {
    await prisma.note.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.user.deleteMany();
  } catch (e) {
    // ignore missing tables
  }
}

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await cleanDatabase();
});
