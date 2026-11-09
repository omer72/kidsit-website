"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { configuredSecret, createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/admin/auth";

export async function login(formData: FormData) {
  const secret = configuredSecret(process.env.STATS_PASSWORD);
  if (!verifyPassword(formData.get("password"), secret)) {
    // Small fixed delay to slow down guessing.
    await new Promise((r) => setTimeout(r, 600));
    redirect("/admin/stats?e=1");
  }
  cookies().set(SESSION_COOKIE, createSessionToken(secret as string), sessionCookieOptions);
  redirect("/admin/stats");
}

export async function logout() {
  cookies().set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  redirect("/admin/stats");
}
