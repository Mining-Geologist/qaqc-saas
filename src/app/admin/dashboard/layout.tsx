"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Shield,
    Users,
    CreditCard,
    Settings,
    LayoutDashboard,
    LogOut,
    BarChart3,
    Key,
} from "lucide-react";

const adminNavItems = [
    {
        title: "Overview",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Users",
        href: "/admin/dashboard/users",
        icon: Users,
    },
    {
        title: "Subscriptions",
        href: "/admin/dashboard/subscriptions",
        icon: CreditCard,
    },
    {
        title: "Analytics",
        href: "/admin/dashboard/analytics",
        icon: BarChart3,
    },
    {
        title: "API Keys",
        href: "/admin/dashboard/api-keys",
        icon: Key,
    },
    {
        title: "Settings",
        href: "/admin/dashboard/settings",
        icon: Settings,
    },
];

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <Sidebar className="border-r border-slate-800">
                    <SidebarHeader className="border-b border-slate-800 p-4">
                        <Link href="/admin/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">Admin Panel</span>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-slate-500">
                                Management
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {adminNavItems.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={pathname === item.href}
                                                className="data-[active=true]:bg-purple-500/10 data-[active=true]:text-purple-400"
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
                        <Link href="/admin">
                            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </Link>
                    </SidebarFooter>
                </Sidebar>

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar */}
                    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/50 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="text-slate-400 hover:text-white" />
                            <h1 className="text-lg font-medium text-white">
                                {adminNavItems.find((item) => item.href === pathname)?.title ?? "Admin Dashboard"}
                            </h1>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                            Administrator
                        </Badge>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 overflow-auto p-6 bg-slate-950">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
