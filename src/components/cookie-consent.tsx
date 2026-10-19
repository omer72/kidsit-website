"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/dictionaries";
import { readConsent, saveConsent } from "@/lib/consent";

export const CONSENT_TXT = {
  en: {
    title: "Cookies & privacy",
    body: "We use essential storage to run the site (your language choice and accessibility-menu preferences). With your permission we also use Google Analytics 4 to understand how the site is used. You can change your choice any time under “Cookie settings”.",
    accept: "Accept all",
    reject: "Reject non-essential",
    settings: "Settings",
    save: "Save choices",
    policy: "Privacy policy",
    essential: ["Essential", "Always on. Language preference (NEXT_LOCALE cookie), accessibility-menu preferences, and this consent choice."],
    analytics: ["Analytics", "Google Analytics 4: anonymous statistics that help us improve the site. Loads only if you allow it."],
    on: "Always on",
    footer: "Cookie settings",
  },
  he: {
    title: "עוגיות ופרטיות",
    body: "אנו משתמשים באחסון חיוני כדי להפעיל את האתר (בחירת השפה והעדפות תפריט הנגישות). בהסכמתכם נשתמש גם ב-Google Analytics 4 כדי להבין איך משתמשים באתר. אפשר לשנות את הבחירה בכל עת דרך „הגדרות עוגיות”.",
    accept: "אישור הכול",
    reject: "דחיית הלא־חיוניות",
    settings: "הגדרות",
    save: "שמירת הבחירה",
    policy: "מדיניות פרטיות",
    essential: ["חיוניות", "פעילות תמיד. העדפת שפה (עוגיית NEXT_LOCALE), העדפות תפריט הנגישות, ובחירת ההסכמה הזו."],
    analytics: ["סטטיסטיקה", "Google Analytics 4: נתונים אנונימיים שעוזרים לנו לשפר את האתר. נטען רק אם תאשרו."],
    on: "פעיל תמיד",
    footer: "הגדרות עוגיות",
  },
} as const;

function Switch({ on, set, labelId }: { on: boolean; set: (v: boolean) => void; labelId: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelId}
      onClick={() => set(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape ${on ? "bg-grape" : "bg-paper"}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-[3px] h-5 w-5 rounded-full transition-[inset-inline-start] ${on ? "bg-white start-[23px]" : "bg-ink start-[3px]"}`}
      />
    </button>
  );
}

/** Consent banner (IKA pattern). Hidden until html.consent-needed or reopened via footer. */
export function CookieConsent({ lang }: { lang: Lang }) {
  const s = CONSENT_TXT[lang];
  const box = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(() => typeof window !== "undefined" && !readConsent());
  const [more, setMore] = useState(false);
  const c0 = typeof window !== "undefined" ? readConsent() : null;
  const [an, setAn] = useState(!!c0?.analytics);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const f = () => {
      opener.current = document.activeElement;
      const c = readConsent();
      setAn(!!c?.analytics);
      setMore(true);
      setOpen(true);
      requestAnimationFrame(() => box.current?.querySelector("button")?.focus());
    };
    addEventListener("kidsit-consent-open", f);
    return () => removeEventListener("kidsit-consent-open", f);
  }, []);

  useEffect(() => {
    const h = document.documentElement;
    if (!open) {
      h.classList.remove("consent-showing");
      return;
    }
    h.classList.add("consent-showing");
    const ro = new ResizeObserver(() => h.style.setProperty("--consent-h", `${box.current?.offsetHeight || 0}px`));
    if (box.current) ro.observe(box.current);
    return () => {
      ro.disconnect();
      h.classList.remove("consent-showing");
    };
  }, [open]);

  const back = () => {
    const o = opener.current as HTMLElement | null;
    opener.current = null;
    if (o?.isConnected) requestAnimationFrame(() => o.focus());
  };
  const done = (v: { analytics: boolean }) => {
    saveConsent(v);
    setOpen(false);
    setMore(false);
    back();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && readConsent()) {
      setOpen(false);
      setMore(false);
      back();
    }
  };

  return (
    <section
      ref={box}
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-t"
      aria-describedby="consent-d"
      data-open={open ? "true" : "false"}
      onKeyDown={onKey}
      className="consent-banner fixed inset-x-0 bottom-0 z-[48] max-h-[85svh] overflow-y-auto border-2 border-ink bg-paper p-5 text-ink shadow-sticker md:inset-x-auto md:bottom-4 md:start-4 md:w-[28rem] md:p-6"
    >
      <h2 id="consent-t" className="font-display text-xl font-semibold">
        {s.title}
      </h2>
      <p id="consent-d" className="mt-2 text-sm font-bold text-ink/80">
        {s.body}{" "}
        <Link href={`/${lang}/privacy#cookies`} className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape">
          {s.policy}
        </Link>
      </p>
      {more && (
        <ul className="mt-4 divide-y-2 divide-ink/10 border-y-2 border-ink/10">
          <li className="flex items-start gap-4 py-3">
            <div className="flex-1">
              <p id="c-ess" className="text-sm font-bold">
                {s.essential[0]}
              </p>
              <p className="text-sm font-bold text-ink/70">{s.essential[1]}</p>
            </div>
            <span className="pt-1 text-xs font-extrabold uppercase text-ink/60">{s.on}</span>
          </li>
          <li className="flex items-start gap-4 py-3">
            <div className="flex-1">
              <p id="c-an" className="text-sm font-bold">
                {s.analytics[0]}
              </p>
              <p className="text-sm font-bold text-ink/70">{s.analytics[1]}</p>
            </div>
            <Switch labelId="c-an" on={an} set={setAn} />
          </li>
        </ul>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => done({ analytics: true })} className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-ink bg-grape px-3 font-bold text-white shadow-sticker-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape">
          {s.accept}
        </button>
        <button type="button" onClick={() => done({ analytics: false })} className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-ink bg-paper px-3 font-bold shadow-sticker-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape">
          {s.reject}
        </button>
        {more ? (
          <button type="button" onClick={() => done({ analytics: an })} className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-ink bg-white px-3 font-bold shadow-sticker-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape">
            {s.save}
          </button>
        ) : (
          <button type="button" aria-expanded="false" onClick={() => setMore(true)} className="col-span-2 inline-flex min-h-11 items-center justify-center text-sm font-bold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape">
            {s.settings}
          </button>
        )}
      </div>
    </section>
  );
}

export function CookieSettingsButton({ lang, className }: { lang: Lang; className?: string }) {
  return (
    <button type="button" onClick={() => import("@/lib/consent").then((m) => m.openConsentSettings())} className={className}>
      {CONSENT_TXT[lang].footer}
    </button>
  );
}
