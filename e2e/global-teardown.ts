import fs from 'fs';
import path from 'path';

async function globalTeardown() {
  const dbFile = path.join(__dirname, 'prisma-e2e/test.db');
  const dbJournalFile = path.join(__dirname, 'prisma-e2e/test.db-journal');

  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
    console.log('Cleaned up E2E test database');
  }

  if (fs.existsSync(dbJournalFile)) {
    fs.unlinkSync(dbJournalFile);
    console.log('Cleaned up E2E test database journal');
  }
}

export default globalTeardown;
