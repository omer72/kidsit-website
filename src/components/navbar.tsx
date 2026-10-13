"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { m, spring } from "./motion";
import type { Dict } from "@/dictionaries";

// Remember the choice for the middleware's "/" redirect and keep the #section.
function rememberLocale(e: React.MouseEvent<HTMLAnchorElement>) {
  const a = e.currentTarget;
  document.cookie = `NEXT_LOCALE=${a.hreflang}; path=/; max-age=31536000; samesite=lax`;
  a.hash = window.location.hash;
}

const Icon = ({ open }: { open: boolean }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
  </svg>
);

export function Navbar({ t }: { t: Dict["nav"] }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const switchLink = {
    href: t.switchHref,
    lang: t.switchLang,
    hrefLang: t.switchLang,
    onClick: rememberLocale,
  };

  return (
    <header className="sticky top-3 z-50 px-3 sm:top-4 sm:px-6">
      <nav
        aria-label={t.label}
        className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border-2 border-ink bg-white px-4 py-1.5 shadow-sticker"
      >
        <a href="#top" className="flex min-h-11 items-center gap-2 font-display text-xl font-semibold">
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

        <ul className="hidden gap-4 text-sm font-bold md:flex">
          {t.links.map((l) => (
            <li key={l.href}>
              <m.a
                href={l.href}
                className="inline-flex min-h-11 items-center px-2 hover:text-grape"
                whileHover={{ y: -2 }}
                transition={spring}
              >
                {l.label}
              </m.a>
            </li>
          ))}
          <li>
            <m.a
              {...switchLink}
              className="inline-flex min-h-11 items-center px-2 text-ink-muted hover:text-grape"
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
            className="inline-flex min-h-11 items-center rounded-xl border-2 border-ink bg-grape px-4 text-sm font-bold text-white shadow-sticker-sm"
            whileHover={{ y: -2, boxShadow: "4px 6px 0 0 #26265E" }}
            whileTap={{ y: 0, boxShadow: "2px 2px 0 0 #26265E" }}
            transition={spring}
          >
            {t.cta}
          </m.a>
          <button
            ref={btnRef}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-ink bg-white md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.closeMenu : t.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon open={open} />
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className="md:hidden">
        <AnimatePresence>
          {open && (
            <m.ul
              className="mx-auto mt-2 max-w-5xl overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-sticker"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {t.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="flex min-h-11 items-center px-5 font-bold hover:bg-paper"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a {...switchLink} className="flex min-h-11 items-center px-5 font-bold hover:bg-paper">
                  {t.switchLabel}
                </a>
              </li>
            </m.ul>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
