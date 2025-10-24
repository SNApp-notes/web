import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PrismaClient as e2eClient } from '../../prisma-e2e/types';

const schemaPath = path.resolve(__dirname, '../../prisma-e2e/schema.prisma');
const dbFile = path.resolve(__dirname, '../../test-vitest.db');

let prisma: e2eClient;

vi.spyOn(console, 'log').mockImplementation(() => undefined);

export async function setupTestDatabase(): Promise<void> {
  process.env.DATABASE_URL = `file:${dbFile}`;

  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
  }

  execSync(`npx prisma db push --skip-generate --schema=${schemaPath}`, {
    env: { ...process.env },
    stdio: 'pipe'
  });

  prisma = new e2eClient();
}

export async function cleanDatabase(): Promise<void> {
  await prisma.note.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
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
