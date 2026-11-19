"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { dictionaries, type Lang } from "@/dictionaries";
import { BLOG_INDEX_PAGE, HOME_PAGE, playStoreHref, storeLinkData, type StoreLink } from "@/lib/store-links";

const COPY = {
  he: { text: "Kidsit זמינה באנדרואיד", cta: "להתקנה ב-Google Play", close: "סגירת הבאנר" },
  en: { text: "Kidsit is on Android", cta: "Install on Google Play", close: "Close banner" },
} as const;

const KEY = "kidsit-android-banner-closed";

/** Which page the banner is on, as a store-link page token; null on pages that get no banner (legal pages, about, …). */
export function bannerLink(pathname: string, lang: Lang): StoreLink | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== lang) return null;
  if (parts.length === 1) return { medium: "home", lang, page: HOME_PAGE, placement: "banner" };
  if (parts[1] === "blog" && parts.length === 2) return { medium: "blog", lang, page: BLOG_INDEX_PAGE, placement: "banner" };
  if (parts[1] === "blog" && parts.length === 3) return { medium: "blog", lang, page: parts[2], placement: "banner" };
  return null;
}

/**
 * Slim install banner for Android only (user agent contains "Android"), on the home page and the blog.
 * Dismissible: the close button hides it for the rest of the browser session (sessionStorage, nothing persistent).
 * The link is a normal store link with placement "banner": utm_source=kidsit.ai, utm_medium=home|blog,
 * utm_campaign=<lang>-<page>, utm_content=banner in the Play referrer; components/store-attribution.tsx still
 * rebuilds it for a detected first touch. iPhones get the Safari Smart App Banner instead (meta tag, per page).
 */
export function AndroidInstallBanner({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let closed = false;
    try {
      closed = window.sessionStorage.getItem(KEY) === "1";
    } catch {
      /* storage blocked: show it, closing still hides it for this page view */
    }
    setShow(/Android/i.test(navigator.userAgent) && !closed);
  }, []);

  const link = bannerLink(pathname ?? "", lang);
  if (!show || !link) return null;
  const t = COPY[lang];
  const labels = dictionaries[lang].stores;
  return (
    <div role="region" aria-label={labels.playAlt} className="relative z-40 flex items-center gap-3 border-b-2 border-ink bg-sunny px-3 py-2 text-ink">
      <button
        type="button"
        aria-label={t.close}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-bold focus-visible:outline-2"
        onClick={() => {
          setShow(false);
          try {
            window.sessionStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
        }}
      >
        <span aria-hidden="true">×</span>
      </button>
      <p className="min-w-0 flex-1 text-sm font-bold leading-snug">{t.text}</p>
      <a
        href={playStoreHref(link)}
        {...storeLinkData("play", link)}
        className="inline-flex min-h-11 shrink-0 items-center rounded-full border-2 border-ink bg-white px-4 text-sm font-extrabold"
      >
        {t.cta}
      </a>
    </div>
  );
}
