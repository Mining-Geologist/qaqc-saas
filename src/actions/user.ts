"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";

export async function syncUser() {
    const user = await currentUser();

    if (!user) return { success: false, error: "Not authenticated" };

    try {
        const email = user.emailAddresses[0]?.emailAddress;

        if (!email) return { success: false, error: "No email found" };

        // Upsert user in database
        const dbUser = await prisma.user.upsert({
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
            include: {
                subscription: true,
            }
        });

        return { success: true, user: dbUser };
    } catch (error) {
        console.error("Error syncing user:", error);
        return { success: false, error: "Failed to sync user" };
    }
}

export async function updateUser(data: { firstName: string; lastName: string }) {
    const user = await currentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    try {
        const fullName = `${data.firstName} ${data.lastName}`.trim();

        await prisma.user.update({
            where: { clerkId: user.id },
            data: {
                name: fullName,
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false, error: "Failed to update profile" };
    }
}
