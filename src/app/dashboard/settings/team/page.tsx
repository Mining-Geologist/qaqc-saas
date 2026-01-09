"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Mail, Trash2, Crown, Users } from "lucide-react";
import { useAuthStore, TeamMember } from "@/stores/auth-store";

const TEAM_LIMITS = {
    FREE: 1,
    PRO_MONTHLY: 5,
    PRO_YEARLY: 10,
};

export default function TeamSettingsPage() {
    const { currentUser, addTeamMember, removeTeamMember, getTeamLimit } = useAuthStore();
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
    const [isInviting, setIsInviting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [error, setError] = useState("");

    if (!currentUser) {
        return null;
    }

    const teamMembers = currentUser.teamMembers || [];
    const maxMembers = getTeamLimit();
    const currentCount = teamMembers.length;
    const canAddMore = currentCount < maxMembers;

    const handleInvite = () => {
        if (!inviteEmail) return;
        setError("");
        setIsInviting(true);

        const result = addTeamMember(inviteEmail, inviteRole);

        if (result.success) {
            setInviteEmail("");
            setIsDialogOpen(false);
        } else {
            setError(result.error || "Failed to add team member");
        }
        setIsInviting(false);
    };

    const handleRemove = (memberId: string) => {
        if (confirm("Are you sure you want to remove this team member?")) {
            removeTeamMember(memberId);
        }
    };

    const getRoleBadge = (role: TeamMember["role"]) => {
        switch (role) {
            case "owner":
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50"><Crown className="w-3 h-3 mr-1" />Owner</Badge>;
            case "admin":
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Admin</Badge>;
            default:
                return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">Member</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Team Members</h1>
                    <p className="text-slate-400">
                        Manage your team and invite new members
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            disabled={!canAddMore}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-white">Invite Team Member</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Send an invitation to join your team.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {error && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Email address</Label>
                                <Input
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Role</Label>
                                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800">
                                        <SelectItem value="member" className="text-white">Member - Can use all tools</SelectItem>
                                        <SelectItem value="admin" className="text-white">Admin - Can manage team</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-700 text-slate-300">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleInvite}
                                disabled={!inviteEmail || isInviting}
                                className="bg-emerald-500 hover:bg-emerald-600"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                {isInviting ? "Sending..." : "Send Invite"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Usage Card */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-400" />
                        Team Usage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-sm">Team members</span>
                                <span className="text-white font-medium">{currentCount} / {maxMembers}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                                    style={{ width: `${(currentCount / maxMembers) * 100}%` }}
                                />
                            </div>
                            {currentUser.plan === "FREE" && (
                                <p className="text-slate-400 text-sm mt-2">Upgrade to add more team members</p>
                            )}
                        </div>
                        {!canAddMore && (
                            <Button variant="outline" className="border-emerald-500/50 text-emerald-400" asChild>
                                <a href="/dashboard/settings">Upgrade Plan</a>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Team Members Table */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Members</CardTitle>
                    <CardDescription className="text-slate-400">
                        {currentCount} member{currentCount !== 1 ? "s" : ""} in your team
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead className="text-slate-400">Member</TableHead>
                                <TableHead className="text-slate-400">Role</TableHead>
                                <TableHead className="text-slate-400">Status</TableHead>
                                <TableHead className="text-slate-400">Joined</TableHead>
                                <TableHead className="text-slate-400 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamMembers.map((member) => (
                                <TableRow key={member.id} className="border-slate-800">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback className="bg-emerald-500 text-white text-xs">
                                                    {member.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-white font-medium">{member.name}</p>
                                                <p className="text-slate-400 text-sm">{member.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                member.status === "active"
                                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                                                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                            }
                                        >
                                            {member.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-300">{member.joinedAt}</TableCell>
                                    <TableCell className="text-right">
                                        {member.role !== "owner" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemove(member.id)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
