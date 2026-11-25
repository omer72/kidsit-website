"use client";

import { Reveal } from "./motion";
import type { Dict } from "@/dictionaries";

// Icons: a bolt (in the moment), a sparkle (tailored), a bookmark (remembers every moment).
const STYLES = [
  { color: "bg-bubblegum", icon: "M13 2 4 14h7l-1 8 9-12h-7l1-8z" },
  { color: "bg-mint", icon: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" },
  { color: "bg-sunny", icon: "M6 3h12v18l-6-4-6 4z" },
];

export function Features({ t }: { t: Dict["features"] }) {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <Reveal>
        <h2 className="min-w-0 text-balance break-words font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">{t.heading}</h2>
        <p className="mt-3 max-w-md text-lg font-bold text-ink/70">{t.sub}</p>
      </Reveal>
      {/* One ruled panel, a row per moment, so reviews and pricing stay the page's only cards */}
      <Reveal className="mt-10">
        <ul className="divide-y-2 divide-ink rounded-3xl border-2 border-ink bg-white shadow-sticker">
          {t.cards.map((f, i) => (
            <li
              key={f.title}
              className="grid gap-3 p-6 sm:p-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:gap-10"
            >
              <h3 className="flex items-center gap-4 font-display text-2xl font-semibold sm:text-3xl">
                <span
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink shadow-sticker-sm ${STYLES[i].color}`}
                >
                  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <path d={STYLES[i].icon} />
                  </svg>
                </span>
                {f.title}
              </h3>
              <p className="text-lg font-bold text-ink/70">{f.desc}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
