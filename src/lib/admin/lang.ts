// Language of the admin stats page. Hebrew (RTL) is the default and what /admin/stats serves;
// English (LTR) is served at /admin/stats/en. Every function that produces display text takes
// an optional `lang` that defaults to "he", so existing callers and tests keep their Hebrew output.
export type Lang = "he" | "en";
export const LANGS: readonly Lang[] = ["he", "en"];
export const isLang = (x: unknown): x is Lang => x === "he" || x === "en";

/** Pick the text for a language. */
export const tr = (lang: Lang, he: string, en: string): string => (lang === "en" ? en : he);

/** Number/date locale for each language. */
export const localeOf = (lang: Lang): string => (lang === "en" ? "en-US" : "he-IL");

/** Path of the stats page in a language. */
export const statsPath = (lang: Lang): string => (lang === "en" ? "/admin/stats/en" : "/admin/stats");

/** Whole number with thousands separators for the language (en-US: 1,234 · he-IL: 1,234). */
export const fmtInt = (n: number, lang: Lang): string => new Intl.NumberFormat(localeOf(lang)).format(n);

type Query = Record<string, string | string[] | undefined>;

/** /admin/stats?lang=en → /admin/stats/en, keeping every other query param (only `lang` is dropped). Null when not asked for English. */
export function englishRedirectTarget(searchParams: Query): string | null {
  const l = searchParams.lang;
  if (!(l === "en" || (Array.isArray(l) && l.includes("en")))) return null;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === "lang" || v === undefined) continue;
    for (const x of Array.isArray(v) ? v : [v]) qs.append(k, x);
  }
  const s = qs.toString();
  return s ? `${statsPath("en")}?${s}` : statsPath("en");
}

/** Safe Lang from untrusted form input. */
export const parseLang = (x: unknown): Lang => (x === "en" ? "en" : "he");
