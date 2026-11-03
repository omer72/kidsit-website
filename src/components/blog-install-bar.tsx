"use client";

import { useEffect, useRef } from "react";
import type { Lang } from "@/dictionaries";
import { StoreBadges } from "./store-badges";

/**
 * Mobile-only install bar for the blog. Desktop keeps the in-article store links.
 * Height is published as --blog-bar-h. On small screens the Nagish trigger stays in the
 * bottom-right corner, in the bar's physical-right gutter (see globals.css). Hidden from md up,
 * matching the navbar's mobile breakpoint.
 */
export function BlogInstallBar({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  const title = lang === "he" ? "הורידו את Kidsit" : "Get Kidsit";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      if (!mq.matches) {
        root.style.removeProperty("--blog-bar-h");
        return;
      }
      root.style.setProperty("--blog-bar-h", `${el.offsetHeight}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    mq.addEventListener("change", sync);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", sync);
      root.style.removeProperty("--blog-bar-h");
    };
  }, []);

  return (
    <div
      ref={ref}
      role="region"
      aria-labelledby="blog-install-title"
      className="blog-install-bar fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <p id="blog-install-title" className="text-center font-display text-sm font-semibold leading-tight">
        {title}
      </p>
      <StoreBadges lang={lang} placement="blog_sticky" className="mt-1.5" />
    </div>
  );
}
