import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  datasource:
    process.env.CI === 'true'
      ? {
          url: process.env.DB_FILE ? process.env.DB_FILE : 'file:./prisma-main/test.db'
        }
      : {
          url: env('DATABASE_URL'),
          shadowDatabaseUrl: env('SHADOW_DATABASE_URL')
        },
  schema: path.join(process.env.CI ? 'prisma-e2e' : 'prisma-main', 'schema.prisma')
});
