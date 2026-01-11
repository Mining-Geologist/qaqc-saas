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

export async function getAdminStats() {
    try {
        const users = await prisma.user.findMany({
            include: { subscription: true }
        });

        const totalUsers = users.length;
        // Assume active if they have a subscription status of ACTIVE or are just created
        const activeUsers = users.filter(u => u.subscription?.status === "ACTIVE" || !u.subscription).length;

        // Paid users have a plan that is not FREE
        const paidUsers = users.filter(u => u.subscription?.plan && u.subscription.plan !== "FREE").length;

        const PLAN_REVENUE: Record<string, number> = {
            FREE: 0,
            PRO_MONTHLY: 49,
            PRO_YEARLY: 468,
        };

        const totalRevenue = users.reduce((sum, u) => {
            const plan = u.subscription?.plan || "FREE";
            return sum + (PLAN_REVENUE[plan] || 0);
        }, 0);

        // Distribution
        const freeCount = users.filter(u => !u.subscription || u.subscription.plan === "FREE").length;
        const proMonthlyCount = users.filter(u => u.subscription?.plan === "PRO_MONTHLY").length;
        const proYearlyCount = users.filter(u => u.subscription?.plan === "PRO_YEARLY").length;

        const recentUsers = users
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                plan: u.subscription?.plan || "FREE",
                createdAt: u.createdAt.toISOString().split('T')[0]
            }));

        return {
            totalUsers,
            activeUsers,
            paidUsers,
            totalRevenue,
            planDistribution: {
                free: freeCount,
                proMonthly: proMonthlyCount,
                proYearly: proYearlyCount
            },
            recentUsers
        };
    } catch (error) {
        console.error("getAdminStats failed:", error);
        // Return empty/safe fallback data
        return {
            totalUsers: 0,
            activeUsers: 0,
            paidUsers: 0,
            totalRevenue: 0,
            planDistribution: { free: 0, proMonthly: 0, proYearly: 0 },
            recentUsers: []
        };
    }
}
