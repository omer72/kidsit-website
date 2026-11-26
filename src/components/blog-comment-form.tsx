"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { Lang } from "@/dictionaries";
import { submitComment, type CommentFormState } from "@/app/[lang]/blog/[slug]/actions";
import { COMMENT_LIMITS, type CommentError } from "@/lib/comments/validate";

const COPY = {
  he: {
    title: "הוספת תגובה",
    name: "שם (יוצג עם התגובה)",
    email: "אימייל (לא חובה, לא יוצג)",
    body: "תגובה",
    submit: "שליחת תגובה",
    sending: "שולחים…",
    sent: "תודה! התגובה תופיע אחרי שנאשר אותה.",
    failed: "השליחה נכשלה. אפשר לנסות שוב בעוד רגע.",
    privacy: "השם יוצג עם התגובה. כתובת האימייל לא חובה ולא תוצג באתר. התגובה תתפרסם רק אחרי אישור. פרטים נוספים ב",
    privacyLink: "מדיניות הפרטיות",
    privacyAfter: ".",
    errors: {
      name: "צריך למלא שם.",
      email: "כתובת האימייל לא תקינה.",
      body: "צריך לכתוב תגובה.",
      post: "הפוסט לא נמצא.",
      spam: "",
      rate: "נשלחו יותר מדי תגובות מכתובת זו. אפשר לנסות שוב בעוד שעה.",
    },
  },
  en: {
    title: "Leave a comment",
    name: "Name (shown with your comment)",
    email: "Email (optional, not shown)",
    body: "Comment",
    submit: "Post comment",
    sending: "Sending…",
    sent: "Thanks! Your comment will appear once we approve it.",
    failed: "Sending failed. Please try again in a moment.",
    privacy: "Your name is shown with the comment. Email is optional and is not displayed on the site. Comments are published only after approval. See the ",
    privacyLink: "privacy policy",
    privacyAfter: " for details.",
    errors: {
      name: "Please enter your name.",
      email: "That email address doesn't look right.",
      body: "Please write a comment.",
      post: "Post not found.",
      spam: "",
      rate: "Too many comments from this address. Please try again in an hour.",
    },
  },
} satisfies Record<Lang, Record<string, unknown> & { errors: Record<CommentError, string> }>;

const input = "mt-1 block min-h-11 w-full rounded-lg border-2 border-ink bg-white px-3 py-2";

function Submit({ ui }: { ui: (typeof COPY)[Lang] }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-full border-2 border-ink bg-grape px-6 py-2 font-bold text-white shadow-sticker-sm disabled:opacity-60"
    >
      {pending ? ui.sending : ui.submit}
    </button>
  );
}

export function BlogCommentForm({ lang, slug }: { lang: Lang; slug: string }) {
  const [state, action] = useFormState<CommentFormState, FormData>(submitComment, { status: "idle" });
  const ui = COPY[lang];
  if (state.status === "sent")
    return (
      <p role="status" className="mt-8 rounded-2xl border-2 border-ink bg-white p-4 font-bold">
        {ui.sent}
      </p>
    );
  const error = state.status === "invalid" ? ui.errors[state.error] : state.status === "failed" ? ui.failed : null;
  return (
    <form action={action} className="mt-8 space-y-4">
      <h3 className="font-display text-xl font-semibold">{ui.title}</h3>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="slug" value={slug} />
      {/* Honeypot: off-screen and skipped by keyboard and screen readers; bots that fill it are dropped. */}
      <div aria-hidden="true" className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="confirm_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="block font-bold">
        {ui.name}
        <input name="name" required maxLength={COMMENT_LIMITS.name} autoComplete="name" className={input} />
      </label>
      <label className="block font-bold">
        {ui.email}
        <input name="email" type="email" dir="ltr" maxLength={COMMENT_LIMITS.email} autoComplete="email" className={input} />
      </label>
      <label className="block font-bold">
        {ui.body}
        <textarea name="body" required rows={4} maxLength={COMMENT_LIMITS.body} dir="auto" className={input} />
      </label>
      {error ? (
        <p role="alert" className="rounded-lg border border-bubblegum bg-bubblegum/10 p-2 text-sm">
          {error}
        </p>
      ) : null}
      <p className="text-sm text-ink-muted">
        {ui.privacy}
        <a href={`/${lang}/privacy`} className="font-bold text-grape underline underline-offset-2">
          {ui.privacyLink}
        </a>
        {ui.privacyAfter}
      </p>
      <Submit ui={ui} />
    </form>
  );
}
