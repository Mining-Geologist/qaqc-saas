"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function adminLogin(formData: FormData) {
    const password = formData.get("password");
    const correctPassword = process.env.ADMIN_ACCESS_PASSWORD;

    if (!correctPassword) {
        return { error: "Admin password not configured in environment variables." };
    }

    if (password === correctPassword) {
        // Set a cookie manually
        cookies().set("admin_session", "true", {
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
    cookies().delete("admin_session");
    redirect("/admin/login");
}
