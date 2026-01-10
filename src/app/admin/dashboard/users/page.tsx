"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MoreVertical, Users, Trash2, Crown, Edit, Ban } from "lucide-react";
import { getRecentUsers } from "@/actions/admin";

const PLAN_LABELS: Record<string, string> = {
    FREE: "Free",
    PRO_MONTHLY: "Pro Monthly",
    PRO_YEARLY: "Pro Yearly",
};

const PLAN_REVENUE: Record<string, number> = {
    FREE: 0,
    PRO_MONTHLY: 49,
    PRO_YEARLY: 468,
};

export default function AdminUsersPage() {
    const [dbUsers, setDbUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        getRecentUsers().then((data) => {
            setDbUsers(data);
            setIsLoading(false);
        });
    }, []);

    const filteredUsers = dbUsers.filter((user) => {
        const fullName = user.name || "Unknown";
        const matchesSearch =
            fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());

        const userPlan = user.subscription?.plan || "FREE";
        const matchesPlan = planFilter === "all" || userPlan === planFilter;

        // Status typically on subscription, but fallback to active
        const status = user.subscription?.status || "ACTIVE";
        const matchesStatus = statusFilter === "all" || status.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesPlan && matchesStatus;
    });

    const getPlanBadge = (plan: string) => {
        const p = plan || "FREE";
        switch (p) {
            case "PRO_YEARLY":
                return <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/50">{PLAN_LABELS[p]}</Badge>;
            case "PRO_MONTHLY":
                return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">{PLAN_LABELS[p]}</Badge>;
            default:
                return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">Free</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        const s = status || "ACTIVE";
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">{s}</Badge>;
    };

    const handleChangePlan = (userId: string, newPlan: string) => alert("Plan change not connected to DB yet");
    const handleToggleSuspend = (userId: string) => alert("Suspend not connected to DB yet");
    const handleDelete = (userId: string) => alert("Delete not connected to DB yet");

    const totalRevenue = dbUsers.reduce((sum, u) => sum + (PLAN_REVENUE[u.subscription?.plan || "FREE"] || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-slate-400">View and manage all SaaS users (Real DB)</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 px-3 py-1">
                        <Users className="w-3 h-3 mr-1" />
                        {dbUsers.length} Total Users
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 px-3 py-1">
                        ${totalRevenue.toLocaleString()} Revenue
                    </Badge>
                </div>
            </div>

            {dbUsers.length === 0 && !isLoading ? (
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="py-12 text-center">
                        <Users className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No users yet</h3>
                        <p className="text-slate-400">
                            Users will appear here after they sign up.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Filters */}
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>
                                <Select value={planFilter} onValueChange={setPlanFilter}>
                                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="Filter by plan" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800">
                                        <SelectItem value="all" className="text-white">All Plans</SelectItem>
                                        <SelectItem value="FREE" className="text-white">Free</SelectItem>
                                        <SelectItem value="PRO_MONTHLY" className="text-white">Pro Monthly</SelectItem>
                                        <SelectItem value="PRO_YEARLY" className="text-white">Pro Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800">
                                        <SelectItem value="all" className="text-white">All Status</SelectItem>
                                        <SelectItem value="active" className="text-white">Active</SelectItem>
                                        <SelectItem value="suspended" className="text-white">Suspended</SelectItem>
                                        <SelectItem value="pending" className="text-white">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users Table */}
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800">
                                        <TableHead className="text-slate-400">User</TableHead>
                                        <TableHead className="text-slate-400">Plan</TableHead>
                                        <TableHead className="text-slate-400">Status</TableHead>
                                        <TableHead className="text-slate-400">Team Size</TableHead>
                                        <TableHead className="text-slate-400">Revenue</TableHead>
                                        <TableHead className="text-slate-400">Joined</TableHead>
                                        <TableHead className="text-slate-400 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => {
                                        const initials = (user.name || "U").substring(0, 2).toUpperCase();
                                        return (
                                            <TableRow key={user.id} className="border-slate-800">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarFallback className="bg-purple-500 text-white text-xs">
                                                                {initials}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-white font-medium">{user.name}</p>
                                                            <p className="text-slate-400 text-sm">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getPlanBadge(user.subscription?.plan)}</TableCell>
                                                <TableCell>{getStatusBadge(user.subscription?.status)}</TableCell>
                                                <TableCell className="text-slate-300">1</TableCell>
                                                <TableCell className="text-slate-300">${PLAN_REVENUE[user.subscription?.plan || "FREE"] || 0}</TableCell>
                                                <TableCell className="text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                                                            <DropdownMenuItem
                                                                className="text-slate-300 focus:bg-slate-800"
                                                                onClick={() => handleChangePlan(user.id, "PRO_YEARLY")}
                                                            >
                                                                <Crown className="w-4 h-4 mr-2" />
                                                                Set Pro Yearly
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-slate-300 focus:bg-slate-800"
                                                                onClick={() => handleChangePlan(user.id, "PRO_MONTHLY")}
                                                            >
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Set Pro Monthly
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-slate-300 focus:bg-slate-800"
                                                                onClick={() => handleChangePlan(user.id, "FREE")}
                                                            >
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Set Free
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-slate-800" />
                                                            <DropdownMenuItem
                                                                className="text-yellow-400 focus:bg-slate-800"
                                                                onClick={() => handleToggleSuspend(user.id)}
                                                            >
                                                                <Ban className="w-4 h-4 mr-2" />
                                                                Toggle Suspend
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-400 focus:bg-slate-800"
                                                                onClick={() => handleDelete(user.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete User
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
