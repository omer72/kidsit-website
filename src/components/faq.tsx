"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { m, Reveal } from "./motion";
import type { Dict } from "@/dictionaries";

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border-2 border-ink bg-white shadow-sticker-sm">
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-display text-lg font-semibold"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {q}
        <m.span
          aria-hidden
          className="text-grape"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          +
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <p className="px-5 pb-5 font-bold text-ink/70">{a}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq({ t }: { t: Dict["faq"] }) {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20 sm:px-6">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.heading}</h2>
      </Reveal>
      <Reveal className="mt-8 space-y-4" delay={0.1}>
        {t.items.map((f) => (
          <Item key={f.q} {...f} />
        ))}
      </Reveal>
    </section>
  );
}
