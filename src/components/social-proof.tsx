"use client";

import { m, useStagger, Reveal } from "./motion";
import type { Dict } from "@/dictionaries";

const QUOTE_COLORS = ["bg-bubblegum", "bg-mint", "bg-sunny"];

type Quote = Dict["social"]["quotes"][number];

function Byline({ q, i, t }: { q: Quote; i: number; t: Dict["social"] }) {
  return (
    <figcaption className="mt-5 flex items-center gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink text-sm font-extrabold ${QUOTE_COLORS[i]}`}
        aria-hidden
      >
        {q.initials}
      </span>
      <span>
        <span className="block font-display font-semibold">{q.name}</span>
        <span className="block text-sm font-bold text-ink/80">
          {t.sourceLabel} · “{q.role}”
          {t.translatedNote && ` (${t.translatedNote})`}
        </span>
      </span>
    </figcaption>
  );
}

export function SocialProof({ t }: { t: Dict["social"] }) {
  const { parent, child } = useStagger();
  const [lead, ...rest] = t.quotes;

  return (
    <section id="parents" className="border-y-2 border-ink bg-sunny">
      {/* the page's one colour band: reviews on sunny, ink text throughout */}
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-24">
        <Reveal>
          <h2 className="min-w-0 text-balance break-words font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">{t.heading}</h2>
        </Reveal>

        {/* The fullest review leads at statement size; the other two follow as cards */}
        <Reveal className="mt-10">
          <figure className="max-w-5xl">
            <blockquote className="font-display text-2xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              “{lead.quote}”
            </blockquote>
            <Byline q={lead} i={0} t={t} />
          </figure>
        </Reveal>

        <m.div
          className="mt-12 grid items-stretch gap-6 md:grid-cols-2 lg:w-10/12"
          variants={parent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {rest.map((q, i) => (
            <m.figure
              key={q.name}
              variants={child}
              className="flex flex-col justify-between rounded-3xl border-2 border-ink bg-white p-6 shadow-sticker"
            >
              <blockquote className="font-bold text-ink/80">“{q.quote}”</blockquote>
              <Byline q={q} i={i + 1} t={t} />
            </m.figure>
          ))}
        </m.div>
      </div>
    </section>
  );
}
