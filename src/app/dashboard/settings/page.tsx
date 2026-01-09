"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Building, User, Shield, Bell } from "lucide-react";

export default function SettingsPage() {
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
                        Your personal information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">First name</Label>
                            <Input defaultValue="Hamza" className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Last name</Label>
                            <Input defaultValue="Salhi" className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Email</Label>
                        <Input defaultValue="hamza@example.com" className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                    <Button className="bg-emerald-500 hover:bg-emerald-600">Save Changes</Button>
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
                                <span className="text-white font-medium">Pro Plan</span>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                                    Active
                                </Badge>
                            </div>
                            <p className="text-slate-400 text-sm mt-1">$49/month · Renews Jan 15, 2026</p>
                        </div>
                        <Button variant="outline" className="border-slate-700 text-slate-300">
                            Manage Billing
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
