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

    // Test 1: Direct fetch to Supabase health endpoint
    try {
        const healthUrl = `${supabaseUrl}/rest/v1/`;
        const healthResponse = await fetch(healthUrl, {
            headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
            },
        });
        results.directFetchStatus = healthResponse.status;
        results.directFetchOk = healthResponse.ok;
    } catch (fetchError) {
        results.directFetchError = fetchError instanceof Error ? fetchError.message : String(fetchError);
        results.directFetchCause = fetchError instanceof Error ? (fetchError as any).cause?.message : undefined;
    }

    // Test 2: Direct fetch to storage endpoint
    try {
        const storageUrl = `${supabaseUrl}/storage/v1/bucket`;
        const storageResponse = await fetch(storageUrl, {
            headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
            },
        });
        results.storageFetchStatus = storageResponse.status;
        results.storageFetchOk = storageResponse.ok;
        if (storageResponse.ok) {
            const buckets = await storageResponse.json();
            results.buckets = buckets;
        }
    } catch (storageError) {
        results.storageFetchError = storageError instanceof Error ? storageError.message : String(storageError);
        results.storageFetchCause = storageError instanceof Error ? (storageError as any).cause?.message : undefined;
    }

    // Test 3: Try Supabase client
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            results.clientBucketsError = bucketsError.message;
        } else {
            results.clientBuckets = buckets?.map(b => b.name) || [];
        }
    } catch (error) {
        results.clientError = error instanceof Error ? error.message : String(error);
    }

    return NextResponse.json({
        success: !!results.directFetchOk && !!results.storageFetchOk,
        ...results
    });
}
