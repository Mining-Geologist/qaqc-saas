"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Microscope, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

function SignInForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, currentUser } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showRegisteredMessage, setShowRegisteredMessage] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        // Check if coming from registration
        if (searchParams.get("registered") === "true") {
            setShowRegisteredMessage(true);
            setTimeout(() => setShowRegisteredMessage(false), 5000);
        }

        // Redirect if already logged in
        if (currentUser) {
            router.push("/dashboard");
        }
    }, [searchParams, currentUser, router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const result = signIn(email, password);

        if (result.success) {
            router.push("/dashboard");
        } else {
            setError(result.error || "Invalid credentials");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                            <Microscope className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">QAQC Pro</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
                    <p className="text-slate-400">Sign in to your account to continue</p>
                </div>

                {showRegisteredMessage && (
                    <div className="mb-4 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <p className="text-emerald-400">Account created! Please sign in.</p>
                    </div>
                )}

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                                    <Link href="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            >
                                {isLoading ? "Signing in..." : "Sign in"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-slate-400">
                                Don&apos;t have an account?{" "}
                                <Link href="/sign-up" className="text-emerald-400 hover:text-emerald-300">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-slate-400 hover:text-white inline-flex items-center gap-2 text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        }>
            <SignInForm />
        </Suspense>
    );
}
