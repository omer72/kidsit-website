"use client";

import Image from "next/image";
import { m, spring, useReducedMotion } from "./motion";
import type { Dict, Lang } from "@/dictionaries";
import { StoreBadges } from "./store-badges";

function Scribble() {
  const reduce = useReducedMotion();
  return (
    <svg
      className="absolute -bottom-2 left-0 w-full"
      viewBox="0 0 220 14"
      fill="none"
      aria-hidden
    >
      <m.path
        d="M3 10 C 40 2, 70 13, 110 7 S 180 3, 217 8"
        stroke="#FFC53D"
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      />
    </svg>
  );
}

function Chip({
  children,
  className,
  delay,
}: {
  children: React.ReactNode;
  className: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={`absolute z-10 ${className}`}>
      <m.span
        className="inline-block rounded-xl border-2 border-ink bg-white px-3 py-1.5 text-sm font-extrabold shadow-sticker"
        initial={{ scale: reduce ? 1 : 0.6 }}
        animate={{ scale: 1 }}
        transition={{ ...spring, delay }}
      >
        {children}
      </m.span>
    </span>
  );
}

export function Hero({ t, lang }: { t: Dict["hero"]; lang: Lang }) {
  return (
    <section id="top" className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-20 pt-8 sm:px-6 sm:gap-12 sm:pt-14 lg:grid-cols-2 lg:gap-8 lg:pt-20">
      <div className="animate-fade-up">
        <span className="inline-block -rotate-2 rounded-lg border-2 border-ink bg-bubblegum px-3 py-1 text-sm font-extrabold text-ink shadow-sticker-sm">
          {t.badge}
        </span>
        <h1 className="mt-5 text-balance font-display text-[clamp(2rem,8vw,3rem)] font-semibold leading-tight sm:mt-6 sm:text-5xl">
          {t.h1a}{" "}
          <span className="relative inline-block">
            {t.h1Scribbled}
            <Scribble />
          </span>
        </h1>
        <p className="mt-6 max-w-md text-lg font-bold text-ink/70">{t.sub}</p>
        {/* Nagish is 60px + 10px off the physical right. px-5 already insets 20px,
            so 3.375rem more (74px total) clears the button with a few px to spare
            and still keeps both 40px badges on one line at 360 and 390. */}
        <div className="mt-6 flex max-w-full flex-wrap items-center gap-x-3 gap-y-3 max-md:pr-[3.375rem] sm:mt-8">
          <StoreBadges lang={lang} placement="site_hero" />
          <a
            href="#demo"
            className="inline-flex min-h-11 w-full items-center justify-center font-bold underline underline-offset-4 sm:w-auto sm:rounded-xl sm:border-2 sm:border-ink sm:bg-white sm:px-6 sm:py-3 sm:no-underline sm:shadow-sticker"
          >
            {t.ctaSecondary}
          </a>
        </div>
      </div>

      {/* Signature: the real app, mid-whisper */}
      <div className="relative mx-auto w-full max-w-[300px]">
        <Chip className="-left-6 top-10 -rotate-6 sm:-left-16" delay={0.5}>
          {t.chipWhisper}
        </Chip>
        <Chip className="-right-4 bottom-24 rotate-3 sm:-right-14" delay={0.7}>
          {t.chipTime}
        </Chip>
        <div className="animate-fade-up-late rotate-1 overflow-hidden rounded-[2.5rem] border-2 border-ink bg-white shadow-sticker-lg">
          <Image
            src={lang === "he" ? "/app-mic-he.png" : "/app-mic.png"}
            alt={t.screenshotAlt}
            width={1290}
            height={2796}
            priority
            sizes="(max-width: 1024px) 300px, 300px"
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
