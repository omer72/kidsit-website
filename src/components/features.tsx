"use client";

import { m, spring, useStagger, Reveal } from "./motion";
import type { Dict } from "@/dictionaries";

const STYLES = [
  { color: "bg-bubblegum", tilt: "-rotate-1" },
  { color: "bg-mint", tilt: "rotate-1" },
  { color: "bg-sunny", tilt: "-rotate-2" },
];

export function Features({ t }: { t: Dict["features"] }) {
  const { parent, child } = useStagger();

  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.heading}</h2>
        <p className="mt-3 max-w-md text-lg font-bold text-ink/70">{t.sub}</p>
      </Reveal>
      <m.div
        className="mt-10 grid gap-6 md:grid-cols-3"
        variants={parent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        {t.cards.map((f, i) => (
          <m.div key={f.title} variants={child} whileHover={{ y: -6 }} transition={spring}>
            {/* rotation lives on a plain element — framer's inline transform would override it */}
            <article
              className={`h-full rounded-3xl border-2 border-ink bg-white p-6 shadow-sticker ${STYLES[i].tilt}`}
            >
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-ink text-2xl shadow-sticker-sm ${STYLES[i].color}`}
                aria-hidden
              >
                {f.emoji}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 font-bold text-ink/70">{f.desc}</p>
            </article>
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
