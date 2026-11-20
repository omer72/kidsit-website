"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { configuredSecret, SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import { approveComment, deleteComment } from "@/lib/comments/db";

// Server actions are public POST endpoints whatever page renders them, so each one checks the session itself.
function requireAdmin() {
  if (!verifySessionToken(cookies().get(SESSION_COOKIE)?.value, configuredSecret(process.env.STATS_PASSWORD))) {
    throw new Error("unauthorized");
  }
}

const UUID = /^[0-9a-f-]{36}$/;

async function moderate(formData: FormData, op: typeof approveComment) {
  requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !UUID.test(id)) return;
  await op(id);
  revalidatePath("/admin/comments");
}

export async function approve(formData: FormData) {
  await moderate(formData, approveComment);
}

export async function remove(formData: FormData) {
  await moderate(formData, deleteComment);
}
