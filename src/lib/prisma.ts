import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
    var __prismaPool: Pool | undefined;
    var __prisma: any | undefined;
}

function createPrismaClient() {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
        throw new Error('POSTGRES_URL environment variable is not set');
    }

    if (!global.__prismaPool) {
        global.__prismaPool = new Pool({ connectionString });
    }

    const adapter = new PrismaPg(global.__prismaPool);
    return new PrismaClient({ adapter } as any);
}

export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prisma;
}
