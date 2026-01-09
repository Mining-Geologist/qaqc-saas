"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, Eye, EyeOff, Save, ExternalLink } from "lucide-react";

interface APIKeys {
    stripePublicKey: string;
    stripeSecretKey: string;
    clerkPublicKey: string;
    clerkSecretKey: string;
}

export default function AdminAPIKeysPage() {
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [keys, setKeys] = useState<APIKeys>({
        stripePublicKey: "",
        stripeSecretKey: "",
        clerkPublicKey: "",
        clerkSecretKey: "",
    });

    // Load keys from localStorage on mount (client-side only)
    useEffect(() => {
        const savedKeys = localStorage.getItem("qaqc-api-keys");
        if (savedKeys) {
            try {
                setKeys(JSON.parse(savedKeys));
            } catch (e) {
                console.error("Failed to parse saved keys");
            }
        }
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem("qaqc-api-keys", JSON.stringify(keys));
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 500);
    };

    const toggleShow = (key: string) => {
        setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-white">API Keys</h1>
                <p className="text-slate-400">
                    Configure your payment and authentication service keys
                </p>
            </div>

            {saved && (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400">
                    API keys saved successfully!
                </div>
            )}

            {/* Stripe Configuration */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Key className="w-5 h-5 text-purple-400" />
                                Stripe Configuration
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Payment processing for subscriptions
                            </CardDescription>
                        </div>
                        <a
                            href="https://dashboard.stripe.com/apikeys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                        >
                            Get Keys <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Publishable Key</Label>
                        <Input
                            value={keys.stripePublicKey}
                            onChange={(e) => setKeys({ ...keys, stripePublicKey: e.target.value })}
                            placeholder="pk_test_..."
                            className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Secret Key</Label>
                        <div className="relative">
                            <Input
                                type={showSecrets.stripeSecret ? "text" : "password"}
                                value={keys.stripeSecretKey}
                                onChange={(e) => setKeys({ ...keys, stripeSecretKey: e.target.value })}
                                placeholder="sk_test_..."
                                className="bg-slate-800 border-slate-700 text-white font-mono text-sm pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShow("stripeSecret")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                {showSecrets.stripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Clerk Configuration */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Key className="w-5 h-5 text-purple-400" />
                                Clerk Configuration
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Authentication service for user management
                            </CardDescription>
                        </div>
                        <a
                            href="https://dashboard.clerk.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                        >
                            Get Keys <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Publishable Key</Label>
                        <Input
                            value={keys.clerkPublicKey}
                            onChange={(e) => setKeys({ ...keys, clerkPublicKey: e.target.value })}
                            placeholder="pk_test_..."
                            className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Secret Key</Label>
                        <div className="relative">
                            <Input
                                type={showSecrets.clerkSecret ? "text" : "password"}
                                value={keys.clerkSecretKey}
                                onChange={(e) => setKeys({ ...keys, clerkSecretKey: e.target.value })}
                                placeholder="sk_test_..."
                                className="bg-slate-800 border-slate-700 text-white font-mono text-sm pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShow("clerkSecret")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                {showSecrets.clerkSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Configuration */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Pricing Plans</CardTitle>
                    <CardDescription className="text-slate-400">
                        Current pricing configuration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-lg">
                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50 mb-2">Free</Badge>
                            <p className="text-2xl font-bold text-white">$0</p>
                            <p className="text-slate-400 text-sm">1 team member</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/30">
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 mb-2">Pro Monthly</Badge>
                            <p className="text-2xl font-bold text-white">$49</p>
                            <p className="text-slate-400 text-sm">5 team members</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-pink-500/30">
                            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/50 mb-2">Pro Yearly</Badge>
                            <p className="text-2xl font-bold text-white">$468</p>
                            <p className="text-slate-400 text-sm">10 team members</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
        </div>
    );
}
