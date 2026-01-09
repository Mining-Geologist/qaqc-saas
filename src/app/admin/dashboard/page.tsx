"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, TrendingUp, Activity, DollarSign, ArrowUpRight, UserPlus } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const PLAN_REVENUE: Record<string, number> = {
    FREE: 0,
    PRO_MONTHLY: 49,
    PRO_YEARLY: 468,
};

export default function AdminDashboardPage() {
    const { users } = useAuthStore();

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const paidUsers = users.filter((u) => u.plan !== "FREE").length;
    const totalRevenue = users.reduce((sum, u) => sum + (PLAN_REVENUE[u.plan] || 0), 0);

    const freeCount = users.filter((u) => u.plan === "FREE").length;
    const proMonthlyCount = users.filter((u) => u.plan === "PRO_MONTHLY").length;
    const proYearlyCount = users.filter((u) => u.plan === "PRO_YEARLY").length;

    const planDistribution = [
        { plan: "Free", count: freeCount, percentage: totalUsers ? Math.round((freeCount / totalUsers) * 100) : 0 },
        { plan: "Pro Monthly", count: proMonthlyCount, percentage: totalUsers ? Math.round((proMonthlyCount / totalUsers) * 100) : 0 },
        { plan: "Pro Yearly", count: proYearlyCount, percentage: totalUsers ? Math.round((proYearlyCount / totalUsers) * 100) : 0 },
    ];

    const recentUsers = [...users]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const stats = [
        {
            title: "Total Users",
            value: totalUsers.toString(),
            icon: Users,
            description: "registered users",
        },
        {
            title: "Active Users",
            value: activeUsers.toString(),
            icon: Activity,
            description: "active accounts",
        },
        {
            title: "Paid Subscriptions",
            value: paidUsers.toString(),
            icon: CreditCard,
            description: "paying customers",
        },
        {
            title: "Monthly Revenue",
            value: `$${totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            description: "total revenue",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Admin Overview</h1>
                <p className="text-slate-400">Monitor your SaaS metrics and user activity</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="w-4 h-4 text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <p className="text-xs text-slate-400">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plan Distribution */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Plan Distribution</CardTitle>
                        <CardDescription className="text-slate-400">
                            Users by subscription plan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {totalUsers === 0 ? (
                            <p className="text-slate-400 text-center py-8">No users yet</p>
                        ) : (
                            <div className="space-y-4">
                                {planDistribution.map((item) => (
                                    <div key={item.plan} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-medium">{item.plan}</span>
                                            <span className="text-slate-400">{item.count} users</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${item.plan === "Free"
                                                        ? "bg-slate-500"
                                                        : item.plan === "Pro Monthly"
                                                            ? "bg-purple-500"
                                                            : "bg-pink-500"
                                                    }`}
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Users */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Signups</CardTitle>
                        <CardDescription className="text-slate-400">
                            Latest users to join the platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentUsers.length === 0 ? (
                            <div className="text-center py-8">
                                <UserPlus className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                                <p className="text-slate-400">No users yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                                            <p className="text-slate-400 text-sm">{user.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge
                                                className={
                                                    user.plan !== "FREE"
                                                        ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                                                        : "bg-slate-500/20 text-slate-400 border-slate-500/50"
                                                }
                                            >
                                                {user.plan === "PRO_YEARLY" ? "Pro Yearly" : user.plan === "PRO_MONTHLY" ? "Pro Monthly" : "Free"}
                                            </Badge>
                                            <p className="text-slate-400 text-xs mt-1">{user.createdAt}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
