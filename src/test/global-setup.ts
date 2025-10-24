import fs from 'fs';
import path from 'path';

export async function teardown() {
  const dbFile = path.join(__dirname, '../../prisma-e2e/test.db');
  const dbJournalFile = path.join(__dirname, '../../prisma-e2e/test.db-journal');

  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
    console.log('Cleaned up Integration test database');
  }

  if (fs.existsSync(dbJournalFile)) {
    fs.unlinkSync(dbJournalFile);
    console.log('Cleaned up Integration test database journal');
  }
}
