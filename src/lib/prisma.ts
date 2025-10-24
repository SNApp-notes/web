import { PrismaClient as mainClient } from '../../prisma-main/types';
import { PrismaClient as e2eClient } from '../../prisma-e2e/types';

// Re-export ALL Prisma types from prisma-main (both schemas are identical)
export * from '../../prisma-main/types';

const getPrismaMain = () => new mainClient();
const getPrismaE2E = () => new e2eClient();

const getPrisma = () =>
  process.env.NODE_ENV === 'test' ? getPrismaE2E() : getPrismaMain();

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof getPrismaMain>;
};

const prisma = globalForPrisma.prisma || getPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
