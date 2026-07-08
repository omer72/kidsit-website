"use client";

import { m, useStagger, Reveal } from "./motion";
import type { Dict } from "@/dictionaries";

const STAT_COLORS = ["bg-sunny", "bg-bubblegum", "bg-mint"];
const QUOTE_COLORS = ["bg-bubblegum", "bg-mint", "bg-sunny"];

export function SocialProof({ t }: { t: Dict["social"] }) {
  const { parent, child } = useStagger();

  return (
    <section id="parents" className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.heading}</h2>
      </Reveal>

      <m.div
        className="mt-8 flex flex-wrap gap-4"
        variants={parent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
      >
        {t.stats.map((s, i) => (
          <m.div key={s.label} variants={child}>
            <div
              className={`${STAT_COLORS[i]} ${i % 2 ? "rotate-1" : "-rotate-1"} rounded-2xl border-2 border-ink px-5 py-3 shadow-sticker`}
            >
              <span className="font-display text-2xl font-semibold">{s.value}</span>{" "}
              <span className="font-extrabold">{s.label}</span>
            </div>
          </m.div>
        ))}
      </m.div>

      <m.div
        className="mt-10 grid gap-6 md:grid-cols-3"
        variants={parent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {t.quotes.map((q, i) => (
          <m.figure
            key={q.name}
            variants={child}
            className="flex flex-col justify-between rounded-3xl border-2 border-ink bg-white p-6 shadow-sticker"
          >
            <blockquote className="font-bold text-ink/80">“{q.quote}”</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink text-sm font-extrabold ${QUOTE_COLORS[i]}`}
                aria-hidden
              >
                {q.initials}
              </span>
              <span>
                <span className="block font-display font-semibold">{q.name}</span>
                <span className="block text-sm font-bold text-ink/60">{q.role}</span>
              </span>
            </figcaption>
          </m.figure>
        ))}
      </m.div>
    </section>
  );
}
