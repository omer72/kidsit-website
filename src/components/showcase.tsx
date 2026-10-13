"use client";

import Image from "next/image";
import { Reveal } from "./motion";
import type { Dict, Lang } from "@/dictionaries";

const SHOTS = [
  { src: "/app-response.png", tilt: "rotate-1" },
  { src: "/app-history.png", tilt: "-rotate-1" },
];

export function Showcase({ t, lang }: { t: Dict["showcase"]; lang: Lang }) {
  return (
    <section id="demo" className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <Reveal>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t.heading}</h2>
        <p className="mt-3 max-w-md text-lg font-bold text-ink/70">{t.sub}</p>
      </Reveal>
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
        <Reveal>
          {/* ponytail: native <video> controls; no player lib until someone asks for autoplay/analytics */}
          <video
            controls
            playsInline
            preload="none"
            poster="/promo-poster.webp"
            aria-label={t.videoLabel}
            className="w-full rounded-3xl border-2 border-ink bg-ink shadow-sticker-lg"
          >
            <source src="/promo-720.webm" type="video/webm" />
            <source src="/promo-720.mp4" type="video/mp4" />
            <track kind="captions" src="/promo.en.vtt" srcLang="en" label="English" default={lang === "en"} />
            <track kind="captions" src="/promo.he.vtt" srcLang="he" label="עברית" default={lang === "he"} />
          </video>
        </Reveal>
        <div className="grid grid-cols-2 gap-6">
          {SHOTS.map((s, i) => (
            <Reveal key={s.src} delay={0.1 * (i + 1)}>
              <figure className={s.tilt}>
                <div className="overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-sticker">
                  <Image
                    src={s.src}
                    alt={t.alts[i]}
                    width={1290}
                    height={2796}
                    sizes="(max-width: 1024px) 45vw, 260px"
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="mt-3 text-center text-sm font-extrabold text-ink-muted">
                  {t.captions[i]}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
