import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
    id: string;
    email: string;
    password?: string; // Stored for mock auth
    firstName: string;
    lastName: string;
    company?: string;
    role: "USER" | "ADMIN";
    plan: "FREE" | "PRO_MONTHLY" | "PRO_YEARLY";
    status: "active" | "pending" | "suspended";
    createdAt: string;
    teamMembers?: TeamMember[];
}

export interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: "owner" | "admin" | "member";
    status: "active" | "pending";
    joinedAt: string;
}

interface AuthState {
    // Current logged in user
    currentUser: User | null;

    // All registered users (for admin view)
    users: User[];

    // Auth actions
    signUp: (userData: Omit<User, "id" | "createdAt" | "role" | "plan" | "status"> & { password?: string }) => { success: boolean; error?: string };
    signIn: (email: string, password: string) => { success: boolean; error?: string; user?: User };
    signOut: () => void;

    // Admin actions
    updateUserPlan: (userId: string, plan: User["plan"]) => void;
    updateUserStatus: (userId: string, status: User["status"]) => void;
    deleteUser: (userId: string) => void;

    // Team management
    addTeamMember: (email: string, role: TeamMember["role"]) => { success: boolean; error?: string };
    removeTeamMember: (memberId: string) => void;

    // Get team size limit based on plan
    getTeamLimit: () => number;
}

const TEAM_LIMITS = {
    FREE: 1,
    PRO_MONTHLY: 5,
    PRO_YEARLY: 10,
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            users: [],

            signUp: (userData) => {
                const { users } = get();

                // Check if email already exists
                if (users.find((u) => u.email === userData.email)) {
                    return { success: false, error: "Email already registered" };
                }

                const newUser: User = {
                    id: `user_${Date.now()}`,
                    email: userData.email,
                    password: userData.password,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    company: userData.company,
                    role: "USER",
                    plan: "FREE",
                    status: "active",
                    createdAt: new Date().toISOString().split("T")[0],
                    teamMembers: [
                        {
                            id: `member_${Date.now()}`,
                            email: userData.email,
                            name: `${userData.firstName} ${userData.lastName}`,
                            role: "owner",
                            status: "active",
                            joinedAt: new Date().toISOString().split("T")[0],
                        },
                    ],
                };

                set({ users: [...users, newUser] });
                return { success: true };
            },

            signIn: (email, password) => {
                const { users } = get();
                const user = users.find((u) => u.email === email);

                if (!user) {
                    return { success: false, error: "User not found" };
                }

                if (user.password && user.password !== password) {
                    return { success: false, error: "Invalid password" };
                }

                if (user.status === "suspended") {
                    return { success: false, error: "Account suspended" };
                }

                set({ currentUser: user });
                return { success: true, user };
            },

            signOut: () => {
                set({ currentUser: null });
            },

            updateUserPlan: (userId, plan) => {
                set((state) => ({
                    users: state.users.map((u) =>
                        u.id === userId ? { ...u, plan } : u
                    ),
                    currentUser:
                        state.currentUser?.id === userId
                            ? { ...state.currentUser, plan }
                            : state.currentUser,
                }));
            },

            updateUserStatus: (userId, status) => {
                set((state) => ({
                    users: state.users.map((u) =>
                        u.id === userId ? { ...u, status } : u
                    ),
                }));
            },

            deleteUser: (userId) => {
                set((state) => ({
                    users: state.users.filter((u) => u.id !== userId),
                }));
            },

            addTeamMember: (email, role) => {
                const { currentUser, getTeamLimit } = get();
                if (!currentUser) return { success: false, error: "Not logged in" };

                const currentTeam = currentUser.teamMembers || [];
                const limit = getTeamLimit();

                if (currentTeam.length >= limit) {
                    return { success: false, error: `Team limit reached (${limit} members)` };
                }

                const newMember: TeamMember = {
                    id: `member_${Date.now()}`,
                    email,
                    name: email.split("@")[0],
                    role,
                    status: "pending",
                    joinedAt: new Date().toISOString().split("T")[0],
                };

                set((state) => {
                    const updatedUser = {
                        ...state.currentUser!,
                        teamMembers: [...(state.currentUser?.teamMembers || []), newMember],
                    };
                    return {
                        currentUser: updatedUser,
                        users: state.users.map((u) =>
                            u.id === state.currentUser?.id ? updatedUser : u
                        ),
                    };
                });

                return { success: true };
            },

            removeTeamMember: (memberId) => {
                set((state) => {
                    if (!state.currentUser) return state;

                    const updatedUser = {
                        ...state.currentUser,
                        teamMembers: state.currentUser.teamMembers?.filter(
                            (m) => m.id !== memberId
                        ),
                    };

                    return {
                        currentUser: updatedUser,
                        users: state.users.map((u) =>
                            u.id === state.currentUser?.id ? updatedUser : u
                        ),
                    };
                });
            },

            getTeamLimit: () => {
                const { currentUser } = get();
                if (!currentUser) return 1;
                return TEAM_LIMITS[currentUser.plan] || 1;
            },
        }),
        {
            name: "qaqc-auth-storage",
        }
    )
);
