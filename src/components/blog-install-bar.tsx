"use client";

import { useEffect, useRef } from "react";
import { dictionaries, storeUrl } from "@/dictionaries";

const btn =
  "inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-ink bg-grape px-2 text-sm font-bold text-white shadow-sticker-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

/**
 * Mobile-only install bar for the Hebrew blog. Desktop keeps the in-article store links.
 * Height is published as --blog-bar-h. On small screens the Nagish trigger stays in the
 * bottom-right corner, in the bar's right gutter (see globals.css). Hidden from md up,
 * matching the navbar's mobile breakpoint.
 */
export function BlogInstallBar() {
  const ref = useRef<HTMLDivElement>(null);
  const { ctaApple, ctaPlay } = dictionaries.he.hero;
  const apple = storeUrl.apple("blog_sticky", "he");
  const play = storeUrl.play("blog_sticky", "he");

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
        הורידו את Kidsit
      </p>
      <div className="mt-1.5 grid grid-cols-2 gap-2 pb-0.5">
        <a href={apple} className={btn}>
          <span className="sr-only">הורידו ב־</span>
          {ctaApple}
        </a>
        <a href={play} className={btn}>
          <span className="sr-only">הורידו ב־</span>
          {ctaPlay}
        </a>
      </div>
    </div>
  );
}
