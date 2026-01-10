"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { testDbConnection } from "@/actions/test-db";

export default function TestDbPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runTest = async () => {
        setLoading(true);
        const res = await testDbConnection();
        setResult(res);
        setLoading(false);
    };

    return (
        <div className="p-8 text-white">
            <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
            <Button onClick={runTest} disabled={loading}>
                {loading ? "Testing..." : "Test DB Connection"}
            </Button>

            {result && (
                <div className="mt-6 p-4 bg-slate-900 rounded border border-slate-700">
                    <h3 className={result.success ? "text-emerald-400" : "text-red-400"}>
                        {result.success ? "SUCCESS" : "FAILED"}
                    </h3>
                    <pre className="mt-2 text-sm text-slate-300 overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
