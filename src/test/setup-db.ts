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

  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  fs.copyFileSync(TEMPLATE_DB_PATH, TEST_DB_PATH);

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
