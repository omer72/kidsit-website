import { neon } from "@neondatabase/serverless";
import { insightsDatabaseUrl } from "@/lib/insights/db";
import type { Lang } from "@/dictionaries";
import type { CommentInput } from "./validate";

export type PublicComment = { id: string; name: string; body: string; created_at: string };
export type AdminComment = PublicComment & { lang: Lang; slug: string; email: string | null; status: "pending" | "approved" };

function db() {
  const url = insightsDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL missing");
  // Neon talks HTTP via fetch; keep Next's fetch cache out of it or approved comments never show up.
  return neon(url, { fetchOptions: { cache: "no-store" } });
}

export async function insertComment(c: CommentInput): Promise<void> {
  await db()`INSERT INTO blog_comments (lang, slug, name, email, body) VALUES (${c.lang}, ${c.slug}, ${c.name}, ${c.email}, ${c.body})`;
}

/** Approved comments for a post, oldest first. Never throws: the post shows no comments if storage is missing. */
export async function listApproved(lang: Lang, slug: string): Promise<PublicComment[]> {
  if (!insightsDatabaseUrl()) return [];
  try {
    return (await db()`SELECT id, name, body, created_at FROM blog_comments
      WHERE lang = ${lang} AND slug = ${slug} AND status = 'approved' ORDER BY created_at`) as PublicComment[];
  } catch {
    console.error("blog comments read failed");
    return [];
  }
}

/** Every comment, pending first, newest first within each group. */
export async function listAll(): Promise<AdminComment[]> {
  return (await db()`SELECT id, lang, slug, name, email, body, status, created_at FROM blog_comments
    ORDER BY status = 'approved', created_at DESC LIMIT 500`) as AdminComment[];
}

export async function approveComment(id: string): Promise<void> {
  await db()`UPDATE blog_comments SET status = 'approved' WHERE id = ${id}`;
}

export async function deleteComment(id: string): Promise<void> {
  await db()`DELETE FROM blog_comments WHERE id = ${id}`;
}
