"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";

export async function syncClerkUsers() {
    // 1. Verify Admin (Basic check, in production use proper role check)
    const admin = await currentUser();
    // Allow for now if authenticated, or check against env list
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        if (!process.env.CLERK_SECRET_KEY) {
            return { success: false, error: "Missing CLERK_SECRET_KEY in environment variables" };
        }

        // 2. Fetch limit 100 users (pagination needed for large scale, simplified for now)
        const client = await clerkClient();
        const clerkUsers = await client.users.getUserList({ limit: 100 });

        console.log(`Clerk API returned ${clerkUsers.data?.length ?? 0} users`);
        if (!clerkUsers.data || clerkUsers.data.length === 0) {
            return { success: true, synced: 0, errors: 0, message: "No users returned from Clerk API" };
        }

        let syncedCount = 0;
        let errors = 0;

        // 3. Upsert each user
        for (const user of clerkUsers.data) {
            try {
                const email = user.emailAddresses[0]?.emailAddress;
                if (!email) continue;

                await prisma.user.upsert({
                    where: { clerkId: user.id },
                    update: {
                        email,
                        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                        avatarUrl: user.imageUrl,
                    },
                    create: {
                        clerkId: user.id,
                        email,
                        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                        avatarUrl: user.imageUrl,
                        role: "USER",
                    },
                });
                syncedCount++;
            } catch (err) {
                console.error(`Failed to sync user ${user.id}:`, err);
                errors++;
            }
        }

        return { success: true, synced: syncedCount, errors };

    } catch (error) {
        console.error("Sync error:", error);
        return { success: false, error: "Failed to fetch users from Clerk" };
    }
}
