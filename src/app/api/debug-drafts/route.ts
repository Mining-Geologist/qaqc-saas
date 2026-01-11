import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
    const user = await currentUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        // Get all drafts for this user
        const drafts = await prisma.analysisDraft.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                toolType: true,
                filePath: true,
                fileName: true,
                fileSize: true,
                lastActive: true,
                config: true,
            },
        });

        return NextResponse.json({
            userId: user.id,
            draftsCount: drafts.length,
            drafts: drafts.map(d => ({
                id: d.id,
                toolType: d.toolType,
                filePath: d.filePath,
                fileName: d.fileName,
                fileSize: d.fileSize,
                lastActive: d.lastActive,
                hasConfig: !!d.config,
            })),
        });
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
