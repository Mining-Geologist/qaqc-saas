"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLogin } from "@/actions/admin-auth";

export default function AdminLoginPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        // Wrap the server action to catch redirects gracefully if needed, 
        // though `redirect` usually throws.
        try {
            const res = await adminLogin(formData);
            if (res?.error) {
                setError(res.error);
                setLoading(false);
            }
        } catch (e) {
            // If it's a redirect error, it's actually success from Next.js perspective
            // But usually server action redirects happen automatically.
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <div className="w-full max-w-md p-8 bg-slate-900 rounded-lg border border-slate-800">
                <h1 className="text-2xl font-bold mb-6 text-center">Admin Access</h1>
                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Secret Password</label>
                        <Input
                            type="password"
                            name="password"
                            placeholder="Enter admin password..."
                            className="bg-slate-950 border-slate-700"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm bg-red-950/50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Checking..." : "Enter Dashboard"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
