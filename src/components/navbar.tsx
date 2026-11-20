"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { colors } from "@/colors";
import { m, MotionRoot, spring } from "./motion";
import type { Dict } from "@/dictionaries";
import { rememberLocale } from "./lang-switch";

const Icon = ({ open }: { open: boolean }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
  </svg>
);

// The navbar brings its own LazyMotion provider. It is rendered on pages that have no <MotionRoot> (blog index, posts,
// legal and other pages); without the provider the `m.*` elements never run their animations, so the mobile menu
// stayed at its initial opacity 0 after opening: invisible, but still taking up its height (an empty gap under the header).
export function Navbar(props: { t: Dict["nav"]; base?: string }) {
  return (
    <MotionRoot>
      <NavbarInner {...props} />
    </MotionRoot>
  );
}

function NavbarInner({ t, base = "" }: { t: Dict["nav"]; base?: string }) {
  const hrefOf = (h: string) => (h.startsWith("#") ? base + h : h);
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
        className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border-2 border-ink bg-white px-4 py-1.5 shadow-sticker"
      >
        <a href={hrefOf("#top")} className="flex min-h-11 items-center gap-2 font-display text-xl font-semibold">
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

        <ul className="hidden gap-4 text-sm font-bold lg:flex">
          {t.links.map((l) => (
            <li key={l.href}>
              <m.a
                href={hrefOf(l.href)}
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
            href={hrefOf("#pricing")}
            className="inline-flex min-h-11 items-center rounded-xl border-2 border-ink bg-grape px-4 text-sm font-bold text-white shadow-sticker-sm"
            whileHover={{ y: -2, boxShadow: `4px 6px 0 0 ${colors.ink}` }}
            whileTap={{ y: 0, boxShadow: `2px 2px 0 0 ${colors.ink}` }}
            transition={spring}
          >
            {t.cta}
          </m.a>
          <button
            ref={btnRef}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-ink bg-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.closeMenu : t.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon open={open} />
          </button>
        </div>
      </nav>

      {/* Out of flow so the open list overlays the page instead of growing the sticky header.
          Enter animation is CSS (see .mobile-nav-panel): the resting style is fully visible. */}
      <div id="mobile-menu" className="pointer-events-none absolute inset-x-0 top-full z-50 px-3 sm:px-6 lg:hidden">
        {open && (
          <ul className="mobile-nav-panel pointer-events-auto mx-auto mt-2 max-h-[calc(100dvh-5.5rem)] max-w-6xl overflow-y-auto rounded-2xl border-2 border-ink bg-white shadow-sticker">
            {t.links.map((l) => (
              <li key={l.href}>
                <a
                  href={hrefOf(l.href)}
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
          </ul>
        )}
      </div>
    </header>
  );
}
