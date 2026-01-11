"use server";

import { db as prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { QaqcToolType } from "@prisma/client";

// Define input type matching the store's draft structure
type DraftData = {
    data: any;
    columns: string[];
    columnMapping: any;
    filters: any;
    styleSettings: any;
    results?: any;
    overrides?: any;
    lastModified: number;
};

export async function saveAnalysisDraft(toolType: QaqcToolType, draft: DraftData) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
        console.error("Save Draft Unauthorized: No clerkUser found");
        return { success: false, error: "Unauthorized" };
    }
    console.log(`Saving draft for ${clerkUser.id} (${clerkUser.emailAddresses[0]?.emailAddress})`);

    try {
        // Resolve internal DB user ID from Clerk ID
        let user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id },
            select: { id: true }
        });

        if (!user) {
            console.log(`User ${clerkUser.id} not found in DB. performing JIT provisioning...`);
            // JIT Provisioning: Create the user record on the fly
            try {
                const email = clerkUser.emailAddresses[0]?.emailAddress;
                if (!email) return { success: false, error: "No email found in profile" };

                user = await prisma.user.create({
                    data: {
                        clerkId: clerkUser.id,
                        email: email,
                        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
                        avatarUrl: clerkUser.imageUrl,
                        role: "USER"
                    },
                    select: { id: true }
                });
                console.log(`JIT Provisioning successful for ${email} (ID: ${user.id})`);
            } catch (createError) {
                console.error("JIT Provisioning failed:", createError);
                return { success: false, error: "Failed to create user profile. Please try again." };
            }
        }

        await prisma.analysisDraft.upsert({
            where: {
                userId_toolType: {
                    userId: user.id,
                    toolType: toolType,
                },
            },
            update: {
                data: draft.data ?? undefined,
                config: {
                    columns: draft.columns,
                    columnMapping: draft.columnMapping,
                    filters: draft.filters,
                    styleSettings: draft.styleSettings,
                    results: draft.results,
                    overrides: draft.overrides,
                },
                lastActive: new Date(),
            },
            create: {
                userId: user.id,
                toolType: toolType,
                data: draft.data ?? undefined,
                config: {
                    columns: draft.columns,
                    columnMapping: draft.columnMapping,
                    filters: draft.filters,
                    styleSettings: draft.styleSettings,
                    results: draft.results,
                    overrides: draft.overrides,
                },
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to save draft:", error);
        return { success: false, error: "Failed to save draft" };
    }
}

export async function loadAnalysisDraft(toolType: QaqcToolType) {
    const clerkUser = await currentUser();
    if (!clerkUser) return { success: false, error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id },
            select: { id: true }
        });

        if (!user) {
            // No profile = no data
            return { success: true, draft: null };
        }

        const draft = await prisma.analysisDraft.findUnique({
            where: {
                userId_toolType: {
                    userId: user.id,
                    toolType: toolType,
                },
            },
        });

        if (!draft) return { success: true, draft: null };

        // Reconstruct the store's draft format
        const config = draft.config as any;
        const parsedDraft: DraftData = {
            data: draft.data as any,
            columns: config.columns || [],
            columnMapping: config.columnMapping || {},
            filters: config.filters || {},
            styleSettings: config.styleSettings || {},
            results: config.results,
            overrides: config.overrides,
            lastModified: draft.lastActive.getTime(),
        };

        return { success: true, draft: parsedDraft };
    } catch (error) {
        console.error("Failed to load draft:", error);
        return { success: false, error: "Failed to load draft" };
    }
}
