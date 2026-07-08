"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { m, spring } from "./motion";
import type { Dict } from "@/dictionaries";

export function Navbar({ t }: { t: Dict["nav"] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-3 z-50 px-3 sm:top-4 sm:px-6">
      <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border-2 border-ink bg-white px-4 py-2.5 shadow-sticker">
        <a href="#top" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="rounded-lg border border-ink"
          />
          <span dir="ltr">
            kidsit<span className="text-grape">·</span>ai
          </span>
        </a>

        <ul className="hidden gap-6 text-sm font-bold md:flex">
          {t.links.map((l) => (
            <li key={l.href}>
              <m.a
                href={l.href}
                className="inline-block hover:text-grape"
                whileHover={{ y: -2 }}
                transition={spring}
              >
                {l.label}
              </m.a>
            </li>
          ))}
          <li>
            <m.a
              href={t.switchHref}
              className="inline-block text-ink/60 hover:text-grape"
              whileHover={{ y: -2 }}
              transition={spring}
            >
              {t.switchLabel}
            </m.a>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <m.a
            href="#pricing"
            className="rounded-xl border-2 border-ink bg-grape px-4 py-2 text-sm font-bold text-white shadow-sticker-sm"
            whileHover={{ y: -2, boxShadow: "4px 6px 0 0 #26265E" }}
            whileTap={{ y: 0, boxShadow: "2px 2px 0 0 #26265E" }}
            transition={spring}
          >
            {t.cta}
          </m.a>
          <button
            className="rounded-xl border-2 border-ink bg-white px-3 py-2 text-sm font-bold md:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <m.ul
            className="mx-auto mt-2 max-w-5xl overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-sticker md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {[...t.links, { label: t.switchLabel, href: t.switchHref }].map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="block px-5 py-3 font-bold hover:bg-paper"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </m.ul>
        )}
      </AnimatePresence>
    </header>
  );
}
