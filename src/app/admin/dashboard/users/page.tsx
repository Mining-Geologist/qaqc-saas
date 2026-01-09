"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MoreVertical, Mail, Ban, Trash2, Crown, Edit, Users } from "lucide-react";
import { useAuthStore, User } from "@/stores/auth-store";

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
    const { users, updateUserPlan, updateUserStatus, deleteUser } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlan = planFilter === "all" || user.plan === planFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;
        return matchesSearch && matchesPlan && matchesStatus;
    });

    const getPlanBadge = (plan: User["plan"]) => {
        switch (plan) {
            case "PRO_YEARLY":
                return <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/50">{PLAN_LABELS[plan]}</Badge>;
            case "PRO_MONTHLY":
                return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">{PLAN_LABELS[plan]}</Badge>;
            default:
                return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">{PLAN_LABELS[plan] || "Free"}</Badge>;
        }
    };

    const getStatusBadge = (status: User["status"]) => {
        switch (status) {
            case "active":
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Active</Badge>;
            case "suspended":
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Suspended</Badge>;
            default:
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending</Badge>;
        }
    };

    const handleChangePlan = (userId: string, newPlan: User["plan"]) => {
        updateUserPlan(userId, newPlan);
    };

    const handleToggleSuspend = (userId: string, currentStatus: User["status"]) => {
        updateUserStatus(userId, currentStatus === "suspended" ? "active" : "suspended");
    };

    const handleDelete = (userId: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            deleteUser(userId);
        }
    };

    const totalRevenue = users.reduce((sum, u) => sum + (PLAN_REVENUE[u.plan] || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-slate-400">View and manage all SaaS users</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 px-3 py-1">
                        <Users className="w-3 h-3 mr-1" />
                        {users.length} Total Users
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 px-3 py-1">
                        ${totalRevenue.toLocaleString()} Revenue
                    </Badge>
                </div>
            </div>

            {users.length === 0 ? (
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
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="border-slate-800">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="bg-purple-500 text-white text-xs">
                                                            {user.firstName[0]}{user.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                                                        <p className="text-slate-400 text-sm">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getPlanBadge(user.plan)}</TableCell>
                                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                                            <TableCell className="text-slate-300">{user.teamMembers?.length || 1}</TableCell>
                                            <TableCell className="text-slate-300">${PLAN_REVENUE[user.plan] || 0}</TableCell>
                                            <TableCell className="text-slate-300">{user.createdAt}</TableCell>
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
                                                            onClick={() => handleToggleSuspend(user.id, user.status)}
                                                        >
                                                            <Ban className="w-4 h-4 mr-2" />
                                                            {user.status === "suspended" ? "Unsuspend" : "Suspend"}
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
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
