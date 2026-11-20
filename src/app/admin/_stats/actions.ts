"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { configuredSecret, createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/admin/auth";
import { parseLang, statsPath } from "@/lib/admin/lang";

// Shared by /admin/stats (he) and /admin/stats/en. The form posts a hidden `lang` field; anything but "en" means Hebrew.
// Authentication is identical for both: same STATS_PASSWORD check, same cookie (path /admin).
export async function login(formData: FormData) {
  const lang = parseLang(formData.get("lang"));
  // The comments admin reuses this login; only that exact path is honored, so it can't become an open redirect.
  const back = formData.get("next") === "/admin/comments" ? "/admin/comments" : statsPath(lang);
  const secret = configuredSecret(process.env.STATS_PASSWORD);
  if (!verifyPassword(formData.get("password"), secret)) {
    // Small fixed delay to slow down guessing.
    await new Promise((r) => setTimeout(r, 600));
    redirect(`${back}?e=1`);
  }
  cookies().set(SESSION_COOKIE, createSessionToken(secret as string), sessionCookieOptions);
  redirect(back);
}

export async function logout(formData: FormData) {
  const lang = parseLang(formData.get("lang"));
  cookies().set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  redirect(statsPath(lang));
}
