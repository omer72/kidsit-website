"use client";

import { useState } from "react";
import { Reveal } from "./motion";
import type { Dict, FaqItem } from "@/dictionaries";

function Item({ q, a, link, i }: FaqItem & { i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border-2 border-ink bg-white shadow-sticker-sm">
      <h3>
        <button
          id={`faq-q-${i}`}
          className="flex min-h-11 w-full items-center justify-between gap-4 px-5 py-4 text-start font-display text-lg font-semibold"
          aria-expanded={open}
          aria-controls={`faq-a-${i}`}
          onClick={() => setOpen((v) => !v)}
        >
          {q}
          <span aria-hidden className="text-2xl leading-none text-grape">
            {open ? "−" : "+"}
          </span>
        </button>
      </h3>
      {/* grid-rows animates height; answers stay in the HTML so no-JS sees them (see globals.css) */}
      <div
        id={`faq-a-${i}`}
        role="region"
        aria-labelledby={`faq-q-${i}`}
        className={`faq-panel grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className={`overflow-hidden ${open ? "" : "invisible"}`}>
          <p className="px-5 pb-5 font-bold text-ink/70">
            {a}
            {link && (
              <>
                {" "}
                <a href={link.href} className="text-grape underline underline-offset-2">
                  {link.label}
                </a>
                .
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Faq({ t }: { t: Dict["faq"] }) {
  return (
    <section id="faq" className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.heading}</h2>
      </Reveal>
      <Reveal className="mt-8 max-w-3xl space-y-4" delay={0.1}>
        {t.items.map((f, i) => (
          <Item key={f.q} {...f} i={i} />
        ))}
      </Reveal>
    </section>
  );
}
