"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Microscope, ArrowLeft, Eye, EyeOff, Check, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function SignUpPage() {
    const router = useRouter();
    const { signUp } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        password: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Validate password
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

        const result = signUp({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            company: formData.company || undefined,
            password: formData.password,
        });

        if (result.success) {
            setSuccess(true);
            // Redirect to sign-in after 2 seconds
            setTimeout(() => {
                router.push("/sign-in?registered=true");
            }, 2000);
        } else {
            setError(result.error || "Failed to create account");
        }
        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
                <Card className="bg-slate-900/50 border-slate-800 max-w-md w-full">
                    <CardContent className="pt-8 pb-8 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
                        <p className="text-slate-400 mb-4">
                            Your account has been created successfully.
                        </p>
                        <p className="text-slate-400 text-sm">
                            Redirecting to sign in...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
                    <p className="text-slate-400">Start your 14-day free trial</p>
                </div>

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-slate-300">First name</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="John"
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-slate-300">Last name</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Doe"
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@example.com"
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-slate-300">Company (Optional)</Label>
                                <Input
                                    id="company"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="Mining Corp"
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                                {isLoading ? "Creating account..." : "Create account"}
                            </Button>
                        </form>

                        <div className="mt-6 space-y-2">
                            {["14-day free trial", "No credit card required", "Cancel anytime"].map((feature) => (
                                <div key={feature} className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    {feature}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-slate-400">
                                Already have an account?{" "}
                                <Link href="/sign-in" className="text-emerald-400 hover:text-emerald-300">
                                    Sign in
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
