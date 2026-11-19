import { DesktopQr } from "./desktop-qr";
import { StoreBadges } from "./store-badges";
import type { Lang } from "@/dictionaries";

/** Marker a post puts (as an HTML comment, so it is never spoken) where the call to action goes. */
export const CTA_MARKER = "<!-- cta -->";

const COPY = {
  he: {
    title: "רוצים משפט לרגע הזה, לילד שלכם?",
    body: "החזיקו את המיקרופון וספרו מה קרה. Kidsit תבנה לכם תוכנית קצרה. 3 תשובות ההדרכה הראשונות בחינם.",
  },
  en: {
    title: "Want the sentence for this moment, for your own child?",
    body: "Hold the mic and say what happened. Kidsit builds you a short plan. Your first 3 guidance answers are free.",
  },
} as const;

/**
 * In-article call to action, placed right after a post's practical advice. Store links use placement "inline",
 * so every post gets its own ct (App Store: <lang>-<slug>-inline) and Play utm_campaign=<lang>-<slug>, utm_content=inline.
 * Wire it into a post by adding the marker comment on its own line before the heading that follows the advice.
 * Desktop visitors also get a QR code (DesktopQr); phones and tablets get the badges only.
 */
export function ArticleCta({ lang, slug }: { lang: Lang; slug: string }) {
  const t = COPY[lang];
  return (
    <aside
      aria-labelledby="article-cta-title"
      className="my-10 flex flex-col gap-5 rounded-2xl border-2 border-ink bg-white p-5 text-start shadow-sticker-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p id="article-cta-title" className="font-display text-xl font-semibold leading-snug text-ink">
          {t.title}
        </p>
        <p className="mt-2 font-bold text-ink/80">{t.body}</p>
        <StoreBadges lang={lang} link={{ medium: "blog", page: slug, placement: "inline" }} className="mt-4" />
      </div>
      <DesktopQr lang={lang} page={slug} />
    </aside>
  );
}

/** Splits a post's HTML at the marker: [before, after], or [html, null] when the post has no marker. */
export function splitAtCta(html: string): [string, string | null] {
  const i = html.indexOf(CTA_MARKER);
  if (i < 0) return [html, null];
  return [html.slice(0, i), html.slice(i + CTA_MARKER.length)];
}
