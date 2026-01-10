import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    Shield,
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminLogout } from "@/actions/admin-auth";

const adminNavItems = [
    { title: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Users", href: "/admin/dashboard/users", icon: Users },
    { title: "API Keys", href: "/admin/dashboard/api-keys", icon: Database },
    { title: "Settings", href: "/admin/dashboard/settings", icon: Settings },
];

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    if (!session || session.value !== "true") {
        redirect("/admin/login");
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-slate-950">
                <Sidebar className="border-r border-slate-800 bg-slate-950">
                    <SidebarHeader className="border-b border-slate-800 p-4">
                        <Link href="/admin" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">Admin Console</span>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-slate-500">Management</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {adminNavItems.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                className="hover:bg-slate-800 hover:text-white data-[active=true]:bg-amber-500/10 data-[active=true]:text-amber-500"
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
                        <form action={adminLogout}>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/20 border-slate-800"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </form>
                    </SidebarFooter>
                </Sidebar>

                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="text-slate-400 hover:text-white" />
                            <Badge
                                variant="outline"
                                className="border-amber-500/50 text-amber-500 bg-amber-500/10"
                            >
                                ADMIN MODE
                            </Badge>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto p-6 bg-slate-950">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
