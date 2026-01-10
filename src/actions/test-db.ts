"use server";

import { db } from "@/lib/db";

export async function testDbConnection() {
    try {
        const userCount = await db.user.count();
        return { success: true, count: userCount, message: "Connected successfully" };
    } catch (error: any) {
        console.error("DB Test Failed:", error);
        return { success: false, error: error.message, stack: error.stack };
    }
}
