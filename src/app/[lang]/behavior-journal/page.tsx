import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { PrintButton } from "@/components/print-button";
import { ogFor } from "@/lib/seo";
import { dictionaries, LANGS, type Lang } from "@/dictionaries";

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const COPY = {
  he: {
    title: "יומן התנהגות ב-4 שורות (PDF להדפסה) | Kidsit AI",
    description: "תבנית חינמית להדפסה: ארבע שורות לכל רגע קשה, כדי לזכור מה קרה ולהביא להדרכת הורים או לפסיכולוג/ית הילדים.",
    h1: "יומן התנהגות ב-4 שורות",
    intro:
      "תבנית קצרה שאפשר למלא בשתי דקות באותו ערב: מתי ואיפה, מה קרה רגע לפני, מה הילד עשה ומה עשיתם, ואיך זה נגמר. מבוססת על מבנה יומן ההתנהגות של Action for Children ועל ההמלצה של Child Mind Institute לעקוב אחרי תדירות, עוצמה ומשך.",
    print: "הדפסה / שמירה כ-PDF",
    entryLabel: "רגע",
    fields: ["מתי ואיפה", "מה קרה רגע לפני", "מה הוא/היא עשה/תה ומה אני עשיתי", "איך זה נגמר / מה עזר"],
    more: "למה זה עוזר ומה להביא לפגישת הדרכת הורים ←",
    moreHref: "/he/blog/hachana-lifgishat-hadracha",
  },
  en: {
    title: "A 4-Line Behavior Journal (Printable PDF) | Kidsit AI",
    description:
      "A free printable template: four lines for each hard moment, to remember what happened and bring to parent coaching or your child's therapist.",
    h1: "A 4-line behavior journal",
    intro:
      "A short template you can fill in two minutes the same evening: when and where, what came right before, what your child did and what you did, and how it ended. Based on the behaviour diary shape from Action for Children and the Child Mind Institute's suggestion to track frequency, intensity, and duration.",
    print: "Print / Save as PDF",
    entryLabel: "Moment",
    fields: ["When and where", "Right before", "What they did, what I did", "How it ended / what helped"],
    more: "Why this helps, and what to bring to a coaching session ←",
    moreHref: "/en/blog/prepare-for-parent-coaching-session",
  },
} as const;

const ENTRIES_PER_PAGE = 6;

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  if (!LANGS.includes(params.lang)) return {};
  const copy = COPY[params.lang];
  return {
    title: copy.title,
    description: copy.description,
    ...ogFor(params.lang, copy.title, copy.description, "/behavior-journal"),
    alternates: {
      canonical: `/${params.lang}/behavior-journal`,
      languages: { en: "/en/behavior-journal", he: "/he/behavior-journal", "x-default": "/en/behavior-journal" },
    },
  };
}

export default function BehaviorJournal({ params }: { params: { lang: Lang } }) {
  const lang = params.lang;
  const d = dictionaries[lang];
  const copy = COPY[lang];
  const other: Lang = lang === "he" ? "en" : "he";

  return (
    <>
      {/* The header language switch does not yet carry a page-aware switchTo (fixed on a separate branch,
          fix/blog-nav-and-form-cleanup, not yet merged here); it falls back to the general switch link. */}
      <div className="journal-screen-only">
        <Navbar t={d.nav} base={`/${lang}`} />
      </div>
      <main className="journal-page mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <div className="journal-screen-only">
          <h1 className="min-w-0 text-balance break-words font-display text-4xl font-semibold sm:text-5xl">{copy.h1}</h1>
          <p className="mt-4 max-w-xl text-lg font-bold text-ink/80">{copy.intro}</p>
          <div className="mt-6 flex items-center gap-3">
            <PrintButton label={copy.print} />
            <a href={copy.moreHref} className="text-sm font-bold text-grape hover:underline">
              {copy.more}
            </a>
          </div>
        </div>

        <div className="journal-print mt-10" dir={lang === "he" ? "rtl" : "ltr"}>
          {Array.from({ length: ENTRIES_PER_PAGE }, (_, i) => (
            <div key={i} className="journal-entry">
              <p className="journal-entry-label">
                {copy.entryLabel} {i + 1}
              </p>
              {copy.fields.map((field) => (
                <div key={field} className="journal-line">
                  <span className="journal-line-label">{field}</span>
                  <span className="journal-line-rule" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
      <div className="journal-screen-only">
        <Footer t={d.footer} base={`/${lang}`} path="/behavior-journal" lang={lang} switchTo={`/${other}/behavior-journal`} />
      </div>
    </>
  );
}
