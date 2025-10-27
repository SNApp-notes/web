import path from 'path';

export const SCHEMA_PATH = path.resolve(__dirname, '../../prisma-e2e/schema.prisma');
export const TEMP_SCHEMA_PATH = path.resolve(
  __dirname,
  '../../prisma-e2e/schema.temp.prisma'
);
export const TEMPLATE_DB_PATH = path.resolve(__dirname, '../../prisma-e2e/template.db');
export const TEST_DB_PATH = path.resolve(__dirname, '../../prisma-e2e/test.db');
export const TEST_DB_JOURNAL_PATH = path.resolve(
  __dirname,
  '../../prisma-e2e/test.db-journal'
);
