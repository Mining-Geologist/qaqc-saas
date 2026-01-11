import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    Database,
    LineChart,
    Microscope,
    FileCheck,
    ArrowRight,
    TrendingUp,
    Users,
} from "lucide-react";
import { getUserProfile } from "@/actions/user";
import { currentUser } from "@clerk/nextjs/server";

const tools = [
    {
        icon: BarChart3,
        title: "CRM Analysis",
        description: "Control Reference Material tracking with ±2/3σ limits",
        href: "/dashboard/crm",
        color: "from-emerald-500 to-teal-500",
    },
    {
        icon: Database,
        title: "Blanks",
        description: "Blank sample monitoring with LOD-based limits",
        href: "/dashboard/blanks",
        color: "from-blue-500 to-cyan-500",
    },
    {
        icon: LineChart,
        title: "Duplicates",
        description: "HARD index analysis with configurable thresholds",
        href: "/dashboard/duplicates",
        color: "from-purple-500 to-pink-500",
    },
    {
        icon: Microscope,
        title: "Z-Score",
        description: "Z-score visualization by CRM and company",
        href: "/dashboard/z-score",
        color: "from-orange-500 to-amber-500",
    },
    {
        icon: FileCheck,
        title: "Check Assay",
        description: "Q-Q plots comparing primary and secondary labs",
        href: "/dashboard/check-assay",
        color: "from-rose-500 to-red-500",
    },
];

const PLAN_LABELS: Record<string, string> = {
    FREE: "Free",
    PRO_MONTHLY: "Pro",
    PRO_YEARLY: "Pro",
};

export default async function DashboardPage() {
    const user = await getUserProfile();
    const clerkUser = await currentUser();

    const userName = user?.name || clerkUser?.firstName || "there";
    // @ts-ignore - Plan might be missing on type if not updated, but standard DB has it
    const userPlan = user?.plan || "FREE";
    const planLabel = PLAN_LABELS[userPlan] || "Free";
    // @ts-ignore - Team members not yet in include
    const teamSize = user?.teamMembers?.length || 1;
    const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Today";

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    Welcome back, {userName}! 👋
                </h1>
                <p className="text-slate-400">
                    Select a QAQC tool below to start analyzing your data.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Your Plan
                        </CardTitle>
                        <Badge
                            className={
                                userPlan === "FREE"
                                    ? "bg-slate-500/20 text-slate-400 border-slate-500/50"
                                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                            }
                        >
                            {planLabel}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {userPlan === "FREE" ? "Free Trial" : "Active"}
                        </div>
                        {userPlan === "FREE" && (
                            <Link href="/dashboard/settings" className="text-xs text-emerald-400 hover:underline">
                                Upgrade to Pro →
                            </Link>
                        )}
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Team Members
                        </CardTitle>
                        <Users className="w-4 h-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{teamSize}</div>
                        <Link href="/dashboard/settings/team" className="text-xs text-slate-400 hover:text-white">
                            Manage team →
                        </Link>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            Member Since
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {joinedDate}
                        </div>
                        <p className="text-xs text-slate-400">Welcome to QAQC Pro!</p>
                    </CardContent>
                </Card>
            </div>

            {/* QAQC Tools Grid */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">QAQC Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.map((tool) => (
                        <Link key={tool.href} href={tool.href}>
                            <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group h-full">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}
                                        >
                                            <tool.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="border-emerald-500/50 text-emerald-400 text-xs"
                                        >
                                            Ready
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-white text-lg mt-4 flex items-center gap-2">
                                        {tool.title}
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-slate-400">
                                        {tool.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Getting Started */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Getting Started</h2>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-emerald-400 font-bold">1</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">Upload your data</h3>
                                    <p className="text-slate-400 text-sm">Upload a CSV file with your QAQC data</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-emerald-400 font-bold">2</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">Map columns</h3>
                                    <p className="text-slate-400 text-sm">Map your CSV columns to the required fields</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-emerald-400 font-bold">3</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">Run analysis</h3>
                                    <p className="text-slate-400 text-sm">View charts, statistics, and export reports</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
