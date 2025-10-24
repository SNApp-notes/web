import { PrismaClient as mainClient } from '../../prisma-main/types';
import { PrismaClient as e2eClient } from '../../prisma-e2e/types';

const getPrisma = () =>
  process.env.NODE_ENV === 'test' ? new e2eClient() : new mainClient();

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof getPrisma>;
};

const prisma = globalForPrisma.prisma || getPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
