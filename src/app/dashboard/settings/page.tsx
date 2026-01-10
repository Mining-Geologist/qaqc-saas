"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Building, User, Shield, Bell, Loader2 } from "lucide-react";
import { syncUser, updateUser } from "@/actions/user";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner"; // Assuming sonner is installed, or use alert

export default function SettingsPage() {
    const { user: clerkUser } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    useEffect(() => {
        if (clerkUser) {
            setFirstName(clerkUser.firstName || "");
            setLastName(clerkUser.lastName || "");

            // Also fetch from DB to be sure
            syncUser().then((res) => {
                if (res.success && res.user?.name) {
                    const parts = res.user.name.split(" ");
                    if (parts.length > 0) setFirstName(parts[0]);
                    if (parts.length > 1) setLastName(parts.slice(1).join(" "));
                }
            });
        }
    }, [clerkUser]);

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            await updateUser({ firstName, lastName });
            // Ideally also update Clerk user via Clerk API if needed, but DB is source of truth for app
            alert("Profile updated successfully!");
        } catch (error) {
            alert("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-slate-400">
                    Manage your account and preferences
                </p>
            </div>

            {/* Profile Settings */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-emerald-400" />
                        Profile
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Your personal information (updates across all devices)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">First name</Label>
                            <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Last name</Label>
                            <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Email</Label>
                        <Input
                            value={clerkUser?.emailAddresses[0]?.emailAddress || ""}
                            disabled
                            className="bg-slate-800/50 border-slate-700 text-slate-400 cursor-not-allowed"
                        />
                    </div>
                    <Button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            {/* Organization Settings */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Building className="w-5 h-5 text-emerald-400" />
                        Organization
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Your company information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Company name</Label>
                        <Input defaultValue="Mining Corp" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                    <Button className="bg-emerald-500 hover:bg-emerald-600">Save Changes</Button>
                </CardContent>
            </Card>

            {/* Subscription */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-400" />
                        Subscription
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Manage your billing and plan
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-medium">Free Plan</span>
                                <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">
                                    Active
                                </Badge>
                            </div>
                            <p className="text-slate-400 text-sm mt-1">Upgrade to Pro for more features</p>
                        </div>
                        <Button variant="outline" className="border-slate-700 text-slate-300">
                            Upgrade
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-emerald-400" />
                        Notifications
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Email notification preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-400 text-sm">Coming soon...</p>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-slate-900/50 border-red-500/30">
                <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">Delete Account</p>
                            <p className="text-slate-400 text-sm">Permanently delete your account and all data</p>
                        </div>
                        <Button variant="destructive">Delete Account</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
