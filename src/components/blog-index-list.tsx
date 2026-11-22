"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Lang } from "@/dictionaries";
import type { PostMeta, Topic } from "@/lib/blog";

export type IndexPost = PostMeta & { displayDate: string };

const TOPIC_LABELS: Record<Lang, Record<Topic, string>> = {
  he: {
    tantrums: "התקפי זעם",
    "screens-sleep": "מסכים ושינה",
    "boundaries-family": "גבולות ומשפחה",
    "coaching-tools": "אימון וכלים",
  },
  en: {
    tantrums: "Tantrums",
    "screens-sleep": "Screens & sleep",
    "boundaries-family": "Boundaries & family",
    "coaching-tools": "Coaching & tools",
  },
};

const ALL_LABEL: Record<Lang, string> = { he: "הכול", en: "All" };
const AGE_PREFIX: Record<Lang, string> = { he: "גילאי", en: "Ages" };
const readingTimeLabel: Record<Lang, (minutes: number) => string> = {
  he: (m) => `${m} דק' קריאה`,
  en: (m) => `${m} min read`,
};

function TopicPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-full border-2 border-ink px-4 text-sm font-bold transition-colors ${
        active ? "bg-ink text-paper" : "bg-white text-ink hover:bg-paper"
      }`}
    >
      {children}
    </button>
  );
}

export function BlogIndexList({ lang, posts, topics }: { lang: Lang; posts: IndexPost[]; topics: readonly Topic[] }) {
  const [activeTopic, setActiveTopic] = useState<Topic | "all">("all");
  const presentTopics = useMemo(() => topics.filter((t) => posts.some((p) => p.topic === t)), [posts, topics]);
  const filtered = activeTopic === "all" ? posts : posts.filter((p) => p.topic === activeTopic);

  return (
    <>
      {presentTopics.length > 0 ? (
        <div role="group" aria-label={ALL_LABEL[lang]} className="mt-8 flex flex-wrap gap-2">
          <TopicPill active={activeTopic === "all"} onClick={() => setActiveTopic("all")}>
            {ALL_LABEL[lang]}
          </TopicPill>
          {presentTopics.map((topic) => (
            <TopicPill key={topic} active={activeTopic === topic} onClick={() => setActiveTopic(topic)}>
              {TOPIC_LABELS[lang][topic]}
            </TopicPill>
          ))}
        </div>
      ) : null}
      <ul className="blog-index-list mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2">
        {filtered.map((p, i) => {
          const lead = i === 0;
          return (
            <li
              key={p.slug}
              className={lead ? "grid gap-6 md:col-span-2 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center md:gap-10" : ""}
            >
              {/* The share card carries its own sticker frame. The title link is the one tab stop; the picture repeats it for pointer users. */}
              <Link href={p.path} tabIndex={-1} aria-hidden="true" className="block">
                <Image
                  src={`/og/${lang}/${p.slug}.png`}
                  alt=""
                  width={1200}
                  height={630}
                  priority={lead}
                  sizes={lead ? "(max-width: 768px) 100vw, 580px" : "(max-width: 768px) 100vw, 470px"}
                  className="h-auto w-full"
                />
              </Link>
              <div className={lead ? "" : "mt-5"}>
                <p className="flex flex-wrap items-center gap-x-2 text-sm font-bold text-ink-muted">
                  <time dateTime={p.date}>{p.displayDate}</time>
                  <span aria-hidden="true">·</span>
                  <span>{readingTimeLabel[lang](p.readingMinutes)}</span>
                  {p.ageRange ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {AGE_PREFIX[lang]} {p.ageRange}
                      </span>
                    </>
                  ) : null}
                </p>
                <h2 className="mt-1 min-w-0 text-balance break-words">
                  <Link
                    href={p.path}
                    className={`blog-index-title block font-display font-semibold hover:text-grape hover:underline active:text-grape ${
                      lead ? "text-2xl sm:text-4xl" : "text-2xl"
                    }`}
                  >
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 max-w-[65ch] font-bold text-ink/80">{p.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
