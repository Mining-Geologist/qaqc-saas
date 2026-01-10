"use server";

import { db as prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function getRecentUsers() {
    // In production, add Admin check here
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { subscription: true }
    });
}
