import path from 'path';

export const SCHEMA_PATH = path.resolve(__dirname, '../../prisma-e2e/schema.prisma');
export const DB_FILE = 'prisma-e2e/test.db';
export const TEMPLATE_DB_FILE = 'prisma-e2e/template.db';
export const TEMPLATE_DB_PATH = path.resolve(__dirname, `../../${TEMPLATE_DB_FILE}`);
export const TEST_DB_PATH = path.resolve(__dirname, `../../${DB_FILE}`);
export const TEST_DB_JOURNAL_PATH = path.resolve(
  __dirname,
  '../../prisma-e2e/test.db-journal'
);
