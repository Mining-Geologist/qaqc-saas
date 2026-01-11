import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const results: Record<string, unknown> = {};

    // Check env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    results.urlSet = !!supabaseUrl;
    results.urlValue = supabaseUrl || "MISSING";
    results.keySet = !!supabaseKey;
    results.keyLength = supabaseKey?.length || 0;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({
            success: false,
            error: "Missing environment variables",
            ...results
        });
    }

    try {
        // Try to create client and list buckets
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            results.bucketsError = bucketsError.message;
        } else {
            results.buckets = buckets?.map(b => b.name) || [];
        }

        // Try to list files in user-files bucket
        const { data: files, error: filesError } = await supabase.storage
            .from("user-files")
            .list("", { limit: 1 });

        if (filesError) {
            results.filesError = filesError.message;
        } else {
            results.filesCount = files?.length || 0;
        }

        // Try a simple upload
        const testData = Buffer.from("test");
        const { error: uploadError } = await supabase.storage
            .from("user-files")
            .upload("_test/connection-test.txt", testData, {
                contentType: "text/plain",
                upsert: true,
            });

        if (uploadError) {
            results.uploadError = uploadError.message;
        } else {
            results.uploadSuccess = true;

            // Clean up test file
            await supabase.storage.from("user-files").remove(["_test/connection-test.txt"]);
        }

        return NextResponse.json({
            success: !bucketsError && !filesError && !uploadError,
            ...results
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            cause: error instanceof Error ? (error as any).cause?.message : undefined,
            ...results
        });
    }
}
