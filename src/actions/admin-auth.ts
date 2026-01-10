"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function adminLogin(formData: FormData) {
    const email = formData.get("email");
    const password = formData.get("password");

    const correctEmail = process.env.ADMIN_EMAIL;
    const correctPassword = process.env.ADMIN_ACCESS_PASSWORD;

    if (!correctPassword || !correctEmail) {
        return { error: "Admin credentials not configured in environment variables." };
    }

    if (email === correctEmail && password === correctPassword) {
        // Set a cookie manually
        (await cookies()).set("admin_session", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });
        redirect("/admin/dashboard");
    } else {
        return { error: "Invalid password" };
    }
}

export async function adminLogout() {
    (await cookies()).delete("admin_session");
    redirect("/admin/login");
}
