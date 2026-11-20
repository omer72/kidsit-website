"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/dictionaries";
import { BlogCommentForm } from "./blog-comment-form";

const COPY = {
  he: { title: "תגובות", none: "עוד אין תגובות. אפשר להיות הראשונים." },
  en: { title: "Comments", none: "No comments yet. Be the first." },
} as const;

type Comment = { id: string; name: string; body: string; iso: string; date: string };

/** Approved reader comments (fetched from /api/comments, so the post page stays static) and the form for a new one. */
export function BlogComments({ lang, slug }: { lang: Lang; slug: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const ui = COPY[lang];

  useEffect(() => {
    fetch(`/api/comments?lang=${lang}&slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : { comments: [] }))
      .then((d: { comments: Comment[] }) => setComments(d.comments))
      .catch(() => setComments([]));
  }, [lang, slug]);

  return (
    <section className="mt-12 border-t-2 border-ink pt-8 text-start" aria-labelledby="post-comments-heading">
      <h2 id="post-comments-heading" className="font-display text-2xl font-semibold">
        {ui.title}
      </h2>
      {comments === null ? null : comments.length ? (
        <ol className="mt-4 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-2xl border-2 border-ink bg-white p-4">
              <p className="font-bold">
                <bdi>{c.name}</bdi>{" "}
                <time className="text-sm font-normal text-ink-muted" dateTime={c.iso}>
                  · {c.date}
                </time>
              </p>
              <p dir="auto" className="mt-2 whitespace-pre-line break-words text-ink/85">
                {c.body}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-ink-muted">{ui.none}</p>
      )}
      <BlogCommentForm lang={lang} slug={slug} />
    </section>
  );
}
