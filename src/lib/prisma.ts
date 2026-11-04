import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

// Hot reload can retain a client created before a schema change. Such a client
// has no delegate for newly generated models and must not be reused.
const cachedClient = globalForPrisma.prisma;
export const prisma =
    cachedClient?.authAttempt && cachedClient?.person && cachedClient?.familyTreeMembership ? cachedClient : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
