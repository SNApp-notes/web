import { PrismaClient as mainClient } from '../../prisma-main/types';
import { PrismaClient as e2eClient, Prisma } from '../../prisma-e2e/types';

// Re-export ALL Prisma types from prisma-main (both schemas are identical)
export * from '../../prisma-main/types';

const options: Prisma.PrismaClientOptions = {
  log: ['error', 'warn']
};

const getPrismaMain = () => new mainClient(options);
const getPrismaE2E = () => new e2eClient(options);

const getPrisma = () => (process.env.CI ? getPrismaE2E() : getPrismaMain());

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof getPrismaMain>;
};

const prisma = globalForPrisma.prisma || getPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
