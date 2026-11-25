"use client";

import { useState } from "react";
import Image from "next/image";
import { Reveal } from "./motion";
import type { Dict, Lang } from "@/dictionaries";

// public/summary/{lang}/*.webp are 585×1266 (half of the 1170×2532 screenshots).
const SHOT_W = 585;
const SHOT_H = 1266;

// Icons for the two points: a calendar (weekly or daily), a bell (the local reminder).
const ICONS = ["M4 6h16v14H4zM4 10h16M8 3v4M16 3v4", "M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"];

export function Summary({ t, lang }: { t: Dict["summary"]; lang: Lang }) {
  const [active, setActive] = useState(0);

  return (
    <section id="summary" className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      {/* Nagish trigger is fixed at the physical bottom-right (60px + 10px).
          padding-right keeps this copy and the screen switcher out of that column, LTR and RTL. */}
      <Reveal className="max-lg:pr-[4.5rem]">
        <span className="inline-block rotate-1 rounded-lg border-2 border-ink bg-mint px-3 py-1 text-sm font-extrabold shadow-sticker-sm">
          {t.badge}
        </span>
        <h2 className="mt-5 min-w-0 max-w-3xl text-balance break-words font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">{t.heading}</h2>
        <p className="mt-4 max-w-3xl text-lg font-bold text-ink/70">{t.lead}</p>
        <p className="mt-3 max-w-3xl font-bold text-ink/70">{t.detail}</p>
      </Reveal>

      <Reveal className="mt-6 grid max-w-3xl gap-4 max-lg:pr-[4.5rem] sm:grid-cols-2" delay={0.05}>
        {t.points.map((p, i) => (
          <article key={p.title} className="rounded-2xl border-2 border-ink bg-white p-4 shadow-sticker-sm">
            <h3 className="flex items-center gap-3 font-display text-lg font-semibold">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-sunny shadow-sticker-sm">
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                  <path d={ICONS[i]} />
                </svg>
              </span>
              {p.title}
            </h3>
            <p className="mt-2 font-bold text-ink/70">{p.text}</p>
          </article>
        ))}
      </Reveal>

      <div className="summary-controls mt-8 max-lg:pr-[4.5rem] lg:hidden">
        <div role="group" aria-label={t.tabsLabel} className="inline-flex max-w-full flex-wrap gap-2">
          {t.shots.map((s, i) => {
            const on = active === i;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                className={`min-h-11 rounded-xl border-2 border-ink px-3 py-2 text-sm font-extrabold shadow-sticker-sm ${
                  on ? "bg-sunny" : "bg-white"
                }`}
                onClick={() => setActive(i)}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid min-w-0 justify-items-center gap-8 lg:mt-10 lg:grid-cols-3 lg:justify-items-stretch">
        {t.shots.map((s, i) => (
          <figure
            key={s.id}
            className={`w-full min-w-0 max-w-[280px] lg:max-w-none ${active === i ? "" : "hidden lg:block"}`}
          >
            <div className="overflow-hidden rounded-[2rem] border-2 border-ink bg-white shadow-sticker">
              <Image
                src={`/summary/${lang}/${s.id}.webp`}
                alt={s.alt}
                width={SHOT_W}
                height={SHOT_H}
                sizes="(max-width: 1023px) 280px, 340px"
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm font-extrabold text-ink-muted">{s.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
