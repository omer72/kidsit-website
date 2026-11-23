import type { Lang } from "@/dictionaries";

export const COMMENT_LIMITS = { name: 80, email: 254, body: 2000 } as const;

export type CommentInput = { lang: Lang; slug: string; name: string; email: string | null; body: string };
export type CommentError = "name" | "email" | "body" | "post" | "spam";

const field = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
};

/** Reader comment form → row to insert. Name and body are required; email is optional. */
export function validateComment(form: FormData): { ok: true; value: CommentInput } | { ok: false; error: CommentError } {
  // Honeypot: hidden from people, filled in by naive bots.
  if (field(form, "confirm_url")) return { ok: false, error: "spam" };
  const lang = field(form, "lang");
  const slug = field(form, "slug");
  if ((lang !== "he" && lang !== "en") || !/^[a-z0-9-]{1,100}$/.test(slug)) return { ok: false, error: "post" };
  const name = field(form, "name");
  if (!name || name.length > COMMENT_LIMITS.name) return { ok: false, error: "name" };
  const body = field(form, "body");
  if (!body || body.length > COMMENT_LIMITS.body) return { ok: false, error: "body" };
  const email = field(form, "email");
  if (email && (email.length > COMMENT_LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { ok: false, error: "email" };
  return { ok: true, value: { lang, slug, name, email: email || null, body } };
}
