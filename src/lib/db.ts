import { PrismaClient } from "@prisma/client";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Prisma 5 Standard Implementation
export const db =
    globalThis.prisma ??
    new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
