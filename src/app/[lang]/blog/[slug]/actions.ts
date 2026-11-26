"use server";

import { headers } from "next/headers";
import { getPost } from "@/lib/blog";
import { insertComment } from "@/lib/comments/db";
import { clientIpFromHeaders, consumeCommentSlot } from "@/lib/comments/rate-limit";
import { validateComment, type CommentError } from "@/lib/comments/validate";

export type CommentFormState = { status: "idle" | "sent" | "failed" } | { status: "invalid"; error: CommentError };

// Public endpoint: the comment is stored as pending and shows on the post only after approval at /admin/comments.
export async function submitComment(_prev: CommentFormState, form: FormData): Promise<CommentFormState> {
  if (!consumeCommentSlot(clientIpFromHeaders(headers()))) return { status: "invalid", error: "rate" };
  const result = validateComment(form);
  // Pretend success to bots so they don't retry with variations.
  if (!result.ok) return result.error === "spam" ? { status: "sent" } : { status: "invalid", error: result.error };
  if (!getPost(result.value.slug, result.value.lang)) return { status: "invalid", error: "post" };
  try {
    await insertComment(result.value);
  } catch {
    // Do not log the comment, the contact details, or the database error text.
    console.error("blog comment insert failed");
    return { status: "failed" };
  }
  return { status: "sent" };
}
