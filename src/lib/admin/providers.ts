// Pluggable sources for /admin/stats beside RevenueCat. Each provider names the env vars it needs and returns
// display-ready data, "not_connected" (env missing) or a safe error message. Nothing here invents numbers.
import { ConfigError, GoogleApiError } from "./google-auth";
import { loadGa4 } from "./ga4";
import { loadGsc } from "./gsc";
import { FUNNEL_PROVIDER } from "./funnel";
import { localeOf, tr, type Lang } from "./lang";

export type Table = { title: string; columns: string[]; rows: string[][]; ltrFirstColumn?: boolean; empty: string };
export type ProviderData = {
  fetchedAt: string;
  range: string;
  totals: { label: string; value: string }[];
  tables: Table[];
  note?: string;
  link?: { href: string; label: string };
};
export type ProviderResult =
  | { state: "not_connected"; missing: string[]; note?: string }
  | { state: "error"; error: string }
  | ({ state: "ok" } & ProviderData);

type Env = Record<string, string | undefined>;
type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export interface StatsProvider {
  id: string;
  /** Hebrew title (default); `titleEn` is the English one. */
  title: string;
  titleEn: string;
  env: string[];
  /** Throws on failure; the page turns that into an error card and doesn't cache it. */
  fetchData(env: Env, fetchImpl?: Fetch, now?: Date, lang?: Lang): Promise<ProviderData>;
}

const missingEnv = (names: string[], env: Env) => names.filter((n) => !env[n]?.trim());

export const providerTitle = (p: StatsProvider, lang: Lang) => (lang === "en" ? p.titleEn : p.title);

export function safeErrorMessage(e: unknown, lang: Lang = "he"): string {
  if (e instanceof ConfigError || e instanceof GoogleApiError) return lang === "en" ? e.en : e.message;
  if (e instanceof Error && /^unexpected /.test(e.message)) return tr(lang, "תשובה בפורמט לא צפוי מ-Google.", "Unexpected response format from Google.");
  return tr(lang, "טעינת הנתונים נכשלה.", "Loading the data failed.");
}

/** Not connected if env is missing; otherwise the data, or a safe error. */
export async function runProvider(p: StatsProvider, env: Env, fetchImpl?: Fetch, now?: Date, lang: Lang = "he"): Promise<ProviderResult> {
  const missing = missingEnv(p.env, env);
  if (missing.length) return { state: "not_connected", missing };
  try {
    return { state: "ok", ...(await p.fetchData(env, fetchImpl, now, lang)) };
  } catch (e) {
    return { state: "error", error: safeErrorMessage(e, lang) };
  }
}

const intFor = (lang: Lang) => (x: number) => new Intl.NumberFormat(localeOf(lang)).format(Math.round(x));
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const pos = (x: number) => x.toFixed(1);
// he: DD.MM.YYYY. en (en-US): MM/DD/YYYY.
const fmtDate = (d: string, lang: Lang = "he") =>
  lang === "en" ? `${d.slice(5, 7)}/${d.slice(8, 10)}/${d.slice(0, 4)}` : `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
/** Show site paths short: https://kidsit.ai/he/blog/x → /he/blog/x */
export const shortPage = (url: string) => {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname) + u.search;
  } catch {
    return url;
  }
};

export const GSC_PROVIDER: StatsProvider = {
  id: "gsc",
  title: "Google Search Console",
  titleEn: "Google Search Console",
  env: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GSC_SITE_URL"],
  async fetchData(env, fetchImpl, now, lang = "he") {
    const int = intFor(lang);
    const s = await loadGsc(env, fetchImpl, now);
    const cols = [tr(lang, "קליקים", "Clicks"), tr(lang, "חשיפות", "Impressions"), "CTR", tr(lang, "מיקום", "Position")];
    const row = (label: string, r: { clicks: number; impressions: number; ctr: number; position: number }) => [
      label, int(r.clicks), int(r.impressions), pct(r.ctr), pos(r.position),
    ];
    return {
      fetchedAt: new Date().toISOString(),
      // LRI…PDI keeps the date span left-to-right inside the Hebrew sentence.
      range:
        lang === "en"
          ? `${fmtDate(s.range.startDate, lang)}–${fmtDate(s.range.endDate, lang)} (28 days, Pacific Time)`
          : `\u2066${fmtDate(s.range.startDate)}–${fmtDate(s.range.endDate)}\u2069 (28 ימים, שעון פסיפיק)`,
      totals: s.totals
        ? [
            { label: cols[0], value: int(s.totals.clicks) },
            { label: cols[1], value: int(s.totals.impressions) },
            { label: "CTR", value: pct(s.totals.ctr) },
            { label: tr(lang, "מיקום ממוצע", "Average position"), value: pos(s.totals.position) },
          ]
        : [],
      tables: [
        { title: tr(lang, "שאילתות מובילות", "Top queries"), columns: [tr(lang, "שאילתה", "Query"), ...cols], rows: s.topQueries.map((r) => row(r.keys[0] ?? "", r)), empty: tr(lang, "אין שאילתות בטווח.", "No queries in range.") },
        { title: tr(lang, "עמודים מובילים", "Top pages"), columns: [tr(lang, "עמוד", "Page"), ...cols], rows: s.topPages.map((r) => row(shortPage(r.keys[0] ?? ""), r)), ltrFirstColumn: true, empty: tr(lang, "אין עמודים בטווח.", "No pages in range.") },
      ],
      note: tr(lang, "ב-Search Console יש עיכוב של כ-2–3 ימים, לכן הטווח מסתיים 3 ימים לפני היום.", "Search Console data lags by about 2–3 days, so the range ends 3 days before today."),
      link: { href: "/admin/stats/gsc-weekly.csv", label: tr(lang, "הורדת CSV שבועי (7 ימים מול 7 קודמים)", "Download weekly CSV (last 7 days vs the 7 before)") },
    };
  },
};

export const GA4_PROVIDER: StatsProvider = {
  id: "ga4",
  title: "Google Analytics 4 · חיפוש אורגני",
  titleEn: "Google Analytics 4 · organic search",
  env: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID"],
  async fetchData(env, fetchImpl, _now, lang = "he") {
    const int = intFor(lang);
    const s = await loadGa4(env, fetchImpl);
    return {
      fetchedAt: new Date().toISOString(),
      range: tr(lang, "28 הימים האחרונים עד אתמול (לפי אזור הזמן של הנכס)", "Last 28 days up to yesterday (property time zone)"),
      totals: s.totalSessions === null ? [] : [{ label: tr(lang, "סשנים מחיפוש אורגני", "Organic search sessions"), value: int(s.totalSessions) }],
      tables: [
        {
          title: tr(lang, "לפי עמוד נחיתה", "By landing page"),
          columns: [tr(lang, "עמוד נחיתה", "Landing page"), tr(lang, "סשנים", "Sessions")],
          rows: s.pages.map((p) => [p.page, int(p.sessions)]),
          ltrFirstColumn: true,
          empty: tr(lang, "אין סשנים אורגניים בטווח.", "No organic sessions in range."),
        },
      ],
      note: `${tr(lang, "ערוץ: Organic Search (sessionDefaultChannelGroup).", "Channel: Organic Search (sessionDefaultChannelGroup).")} ${
        s.rowCount > s.pages.length
          ? tr(lang, `מוצגים ${s.pages.length} מתוך ${s.rowCount} עמודים.`, `Showing ${s.pages.length} of ${s.rowCount} pages.`)
          : ""
      }`.trim(),
    };
  },
};

/** The Google sources. */
export const EXTRA_PROVIDERS: StatsProvider[] = [GSC_PROVIDER, GA4_PROVIDER];
/** Every provider card on /admin/stats, in display order: the in-app funnel first, then Google. */
export const STATS_PROVIDERS: StatsProvider[] = [FUNNEL_PROVIDER, ...EXTRA_PROVIDERS];
export const providerById = (id: string) => STATS_PROVIDERS.find((p) => p.id === id);
