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
    // Cloud storage file info
    filePath?: string;
    fileName?: string;
    fileSize?: number;
};

export async function saveAnalysisDraft(
    toolType: QaqcToolType,
    draft: DraftData,
    fileInfo?: { filePath: string; fileName: string; fileSize: number }
) {
    const user = await currentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        // Ensure user exists in DB and get their internal ID
        const dbUser = await prisma.user.upsert({
            where: { clerkId: user.id },
            update: {},
            create: {
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || "",
                name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                avatarUrl: user.imageUrl,
            },
        });

        await prisma.analysisDraft.upsert({
            where: {
                userId_toolType: {
                    userId: dbUser.id,
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
                // Update file info if provided
                ...(fileInfo && {
                    filePath: fileInfo.filePath,
                    fileName: fileInfo.fileName,
                    fileSize: fileInfo.fileSize,
                }),
                lastActive: new Date(),
            },
            create: {
                userId: dbUser.id,
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
                // Set file info if provided
                ...(fileInfo && {
                    filePath: fileInfo.filePath,
                    fileName: fileInfo.fileName,
                    fileSize: fileInfo.fileSize,
                }),
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to save draft:", error);
        return { success: false, error: "Failed to save draft" };
    }
}

export async function loadAnalysisDraft(toolType: QaqcToolType) {
    const user = await currentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    try {
        // Get internal DB user ID
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id }
        });

        if (!dbUser) {
            return { success: true, draft: null };
        }

        const draft = await prisma.analysisDraft.findUnique({
            where: {
                userId_toolType: {
                    userId: dbUser.id,
                    toolType: toolType,
                },
            },
        });

        if (!draft) return { success: true, draft: null };

        // Reconstruct the store's draft format
        const config = draft.config as any;
        const parsedDraft: DraftData & { filePath?: string; fileName?: string; fileSize?: number } = {
            data: draft.data as any,
            columns: config.columns || [],
            columnMapping: config.columnMapping || {},
            filters: config.filters || {},
            styleSettings: config.styleSettings || {},
            results: config.results,
            overrides: config.overrides,
            lastModified: draft.lastActive.getTime(),
            // Include cloud storage file info
            filePath: draft.filePath || undefined,
            fileName: draft.fileName || undefined,
            fileSize: draft.fileSize || undefined,
        };

        return { success: true, draft: parsedDraft };
    } catch (error) {
        console.error("Failed to load draft:", error);
        return { success: false, error: "Failed to load draft" };
    }
}
