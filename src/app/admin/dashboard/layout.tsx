import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
        <div className="admin-protected-area">
            {/* We can add a separate Admin Sidebar here if needed later */}
            <div className="bg-amber-900/10 border-b border-amber-900/20 p-2 text-center text-amber-500 text-xs font-mono">
                ADMIN MODE ACTIVE
            </div>
            {children}
        </div>
    );
}
