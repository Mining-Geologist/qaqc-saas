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
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-7 h-7 text-white"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-2xl font-bold mb-2 text-center text-white">Admin Portal</h1>
                <p className="text-slate-400 text-center mb-8 text-sm">Restricted access area</p>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-300 uppercase tracking-wider">Email Address</label>
                        <Input
                            type="email"
                            name="email"
                            placeholder="admin@example.com"
                            className="bg-slate-950/50 border-slate-700 focus:border-amber-500 focus:ring-amber-500/20 h-10"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5 text-slate-300 uppercase tracking-wider">Access Password</label>
                        <Input
                            type="password"
                            name="password"
                            placeholder="••••••••••••"
                            className="bg-slate-950/50 border-slate-700 focus:border-amber-500 focus:ring-amber-500/20 h-10"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm bg-red-950/20 border border-red-900/50 p-3 rounded-md flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium h-10 shadow-lg shadow-amber-900/20"
                        disabled={loading}
                    >
                        {loading ? "Authenticating..." : "Enter Console"}
                    </Button>

                    <div className="pt-4 text-center">
                        <a href="/" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
                            ← Back to Application
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
