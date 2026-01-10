"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BarChart3,
    Database,
    LineChart,
    Microscope,
    FileCheck,
    Settings,
    LogOut,
    CreditCard,
    LayoutDashboard,
    ChevronUp,
    Users,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "CRM Analysis", href: "/dashboard/crm", icon: BarChart3 },
    { title: "Blanks", href: "/dashboard/blanks", icon: Database },
    { title: "Duplicates", href: "/dashboard/duplicates", icon: LineChart },
    { title: "Z-Score", href: "/dashboard/z-score", icon: Microscope },
    { title: "Check Assay", href: "/dashboard/check-assay", icon: FileCheck },
];

const settingsItems = [
    { title: "Team Members", href: "/dashboard/settings/team", icon: Users },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

const PLAN_LABELS: Record<string, string> = {
    FREE: "Free",
    PRO_MONTHLY: "Pro Monthly",
    PRO_YEARLY: "Pro Yearly",
};

import { useUser, UserButton } from "@clerk/nextjs";
import { syncUser } from "@/actions/user";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isLoaded } = useUser();
    const [dbUser, setDbUser] = useState<any>(null);

    // Sync user to DB on load and get real data
    useEffect(() => {
        if (user) {
            syncUser().then((result) => {
                if (result.success) {
                    setDbUser(result.user);
                }
            });
        }
    }, [user]);

    if (!isLoaded || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    const userName = dbUser?.name || user.fullName || "User";
    const userPlan = dbUser?.subscription?.plan || "FREE";
    const planLabel = PLAN_LABELS[userPlan] || "Free";

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <Sidebar className="border-r border-slate-800">
                    <SidebarHeader className="border-b border-slate-800 p-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                <Microscope className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">QAQC Pro</span>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-slate-500">QAQC Tools</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navItems.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={pathname === item.href}
                                                className="data-[active=true]:bg-emerald-500/10 data-[active=true]:text-emerald-400"
                                            >
                                                <Link href={item.href}>
                                                    <item.icon className="w-4 h-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarGroup>
                            <SidebarGroupLabel className="text-slate-500">Account</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {settingsItems.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={pathname === item.href || pathname.startsWith(item.href)}
                                                className="data-[active=true]:bg-emerald-500/10 data-[active=true]:text-emerald-400"
                                            >
                                                <Link href={item.href}>
                                                    <item.icon className="w-4 h-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-slate-800 p-4">
                        <div className="flex items-center gap-3 w-full">
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-8 h-8"
                                    }
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{userName}</p>
                                <p className="text-xs text-slate-400">{planLabel}</p>
                            </div>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/50 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="text-slate-400 hover:text-white" />
                            <h1 className="text-lg font-medium text-white">
                                {navItems.find((item) => item.href === pathname)?.title ??
                                    settingsItems.find((item) => pathname.startsWith(item.href))?.title ??
                                    "Dashboard"}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge
                                variant="outline"
                                className="border-slate-500/50 text-slate-400"
                            >
                                {planLabel}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-400 hover:text-emerald-300"
                                asChild
                            >
                                <Link href="/dashboard/settings">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Upgrade
                                </Link>
                            </Button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto p-6 bg-slate-950">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
}
