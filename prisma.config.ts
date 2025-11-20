import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';
export default defineConfig({
  datasource:
    process.env.CI === 'true'
      ? {
          url: 'file:./test.db'
        }
      : {
          url: env('DATABASE_URL'),
          shadowDatabaseUrl: env('SHADOW_DATABASE_URL')
        },
  schema: path.join(process.env.CI ? 'prisma-e2e' : 'prisma-main', 'schema.prisma')
});
