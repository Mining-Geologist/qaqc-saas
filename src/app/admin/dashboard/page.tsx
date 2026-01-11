"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, TrendingUp, Activity, DollarSign, ArrowUpRight, UserPlus, RefreshCw } from "lucide-react";
import { getAdminStats } from "@/actions/admin";
import { syncClerkUsers } from "@/actions/admin-sync";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const PLAN_REVENUE: Record<string, number> = {
    FREE: 0,
    PRO_MONTHLY: 49,
    PRO_YEARLY: 468,
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadStats = () => {
        setIsLoading(true);
        setError(null);
        getAdminStats()
            .then((data) => {
                if (!data) throw new Error("No data received");
                setStats(data);
            })
            .catch((err) => {
                console.error("Failed to load admin stats:", err);
                setError("Failed to load stats. Please try again.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => {
        loadStats();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await syncClerkUsers();
            if (res.success) {
                alert(`Synced ${res.synced} users successfully.\nErrors: ${res.errors}`);
                loadStats();
            } else {
                alert(`Sync failed: ${res.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Sync error occurred");
        } finally {
            setIsSyncing(false);
        }
    };

    if (isLoading) {
        return <div className="text-white flex items-center gap-2"><div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> Loading stats...</div>;
    }

    if (error) {
        return (
            <div className="text-red-400 p-4 border border-red-500/20 bg-red-500/10 rounded-lg">
                <p>Error: {error}</p>
                <Button onClick={loadStats} variant="outline" className="mt-2 text-white border-slate-700">Retry</Button>
            </div>
        );
    }

    if (!stats) return <div className="text-slate-400">No stats available.</div>;

    const { totalUsers, activeUsers, paidUsers, totalRevenue, planDistribution, recentUsers } = stats;

    const planData = [
        { plan: "Free", count: planDistribution.free, percentage: totalUsers ? Math.round((planDistribution.free / totalUsers) * 100) : 0 },
        { plan: "Pro Monthly", count: planDistribution.proMonthly, percentage: totalUsers ? Math.round((planDistribution.proMonthly / totalUsers) * 100) : 0 },
        { plan: "Pro Yearly", count: planDistribution.proYearly, percentage: totalUsers ? Math.round((planDistribution.proYearly / totalUsers) * 100) : 0 },
    ];

    const statsGrid = [
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Admin Overview</h1>
                    <p className="text-slate-400">Monitor your SaaS metrics and user activity (Live DB)</p>
                </div>
                <Button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Syncing..." : "Sync Users"}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsGrid.map((stat) => (
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
                                {planData.map((item) => (
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
                                {recentUsers.map((user: any) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium">{user.name || "Unknown User"}</p>
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
