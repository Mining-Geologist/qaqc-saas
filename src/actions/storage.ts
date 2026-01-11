"use server";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

const BUCKET_NAME = "user-files";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB default limit

// Lazily create Supabase client to ensure env vars are available at runtime
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!supabaseClient) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log("Supabase URL:", supabaseUrl ? "SET" : "MISSING");
        console.log("Service Key:", supabaseServiceKey ? "SET (length: " + supabaseServiceKey.length + ")" : "MISSING");

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error(`Missing Supabase configuration. URL: ${!!supabaseUrl}, Key: ${!!supabaseServiceKey}`);
        }

        supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    }
    return supabaseClient;
}

export type UploadResult = {
    success: boolean;
    path?: string;
    size?: number;
    error?: string;
};

/**
 * Upload a file to Supabase Storage
 */
export async function uploadUserFile(
    toolType: string,
    fileData: string, // Base64 encoded file data
    fileName: string
): Promise<UploadResult> {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const supabase = getSupabaseClient();

        // Decode base64 to buffer
        const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        console.log("Upload attempt:", {
            userId: user.id,
            toolType,
            fileName,
            bufferSize: buffer.length,
        });

        // Check file size
        if (buffer.length > MAX_FILE_SIZE) {
            return { success: false, error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` };
        }

        // Create unique path: userId/toolType/filename
        const path = `${user.id}/${toolType}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, buffer, {
                contentType: "text/csv",
                upsert: true, // Overwrite if exists
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return { success: false, error: uploadError.message };
        }

        console.log("Upload successful:", path);
        return {
            success: true,
            path,
            size: buffer.length,
        };
    } catch (error) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
        return { success: false, error: errorMessage };
    }
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadUserFile(
    path: string
): Promise<{ success: boolean; data?: string; error?: string }> {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    // Security: Ensure user can only download their own files
    if (!path.startsWith(user.id + "/")) {
        return { success: false, error: "Access denied" };
    }

    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(path);

        if (error) {
            console.error("Supabase download error:", error);
            return { success: false, error: error.message };
        }

        // Convert to base64 for transfer
        const arrayBuffer = await data.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        return { success: true, data: base64 };
    } catch (error) {
        console.error("Download error:", error);
        return { success: false, error: "Failed to download file" };
    }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteUserFile(
    path: string
): Promise<{ success: boolean; error?: string }> {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    // Security: Ensure user can only delete their own files
    if (!path.startsWith(user.id + "/")) {
        return { success: false, error: "Access denied" };
    }

    try {
        const supabase = getSupabaseClient();

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([path]);

        if (error) {
            console.error("Supabase delete error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, error: "Failed to delete file" };
    }
}

/**
 * Get user's storage usage
 */
export async function getUserStorageUsage(): Promise<{
    success: boolean;
    totalBytes?: number;
    files?: Array<{ name: string; size: number; path: string }>;
    error?: string;
}> {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(user.id, { sortBy: { column: "created_at", order: "desc" } });

        if (error) {
            console.error("Supabase list error:", error);
            return { success: false, error: error.message };
        }

        let totalBytes = 0;
        const files: Array<{ name: string; size: number; path: string }> = [];

        // List files in subdirectories (tool types)
        for (const folder of data || []) {
            if (folder.id) continue; // Skip non-folder items at root

            const { data: toolFiles } = await supabase.storage
                .from(BUCKET_NAME)
                .list(`${user.id}/${folder.name}`);

            for (const file of toolFiles || []) {
                if (file.metadata?.size) {
                    totalBytes += file.metadata.size;
                    files.push({
                        name: file.name,
                        size: file.metadata.size,
                        path: `${user.id}/${folder.name}/${file.name}`,
                    });
                }
            }
        }

        return { success: true, totalBytes, files };
    } catch (error) {
        console.error("List error:", error);
        return { success: false, error: "Failed to get storage usage" };
    }
}
