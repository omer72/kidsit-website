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

/** Safe Lang from untrusted form input. */
export const parseLang = (x: unknown): Lang => (x === "en" ? "en" : "he");
