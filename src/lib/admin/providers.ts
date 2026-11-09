// Pluggable sources for /admin/stats beside RevenueCat. Each provider names the env vars it needs and returns
// display-ready data, "not_connected" (env missing) or a safe error message. Nothing here invents numbers.
import { ConfigError, GoogleApiError } from "./google-auth";
import { loadGa4 } from "./ga4";
import { loadGsc } from "./gsc";

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
  title: string;
  env: string[];
  /** Throws on failure; the page turns that into an error card and doesn't cache it. */
  fetchData(env: Env, fetchImpl?: Fetch, now?: Date): Promise<ProviderData>;
}

const missingEnv = (names: string[], env: Env) => names.filter((n) => !env[n]?.trim());

export function safeErrorMessage(e: unknown): string {
  if (e instanceof ConfigError || e instanceof GoogleApiError) return e.message;
  if (e instanceof Error && /^unexpected /.test(e.message)) return "תשובה בפורמט לא צפוי מ-Google.";
  return "טעינת הנתונים נכשלה.";
}

/** Not connected if env is missing; otherwise the data, or a safe error. */
export async function runProvider(p: StatsProvider, env: Env, fetchImpl?: Fetch, now?: Date): Promise<ProviderResult> {
  const missing = missingEnv(p.env, env);
  if (missing.length) return { state: "not_connected", missing };
  try {
    return { state: "ok", ...(await p.fetchData(env, fetchImpl, now)) };
  } catch (e) {
    return { state: "error", error: safeErrorMessage(e) };
  }
}

const int = (x: number) => new Intl.NumberFormat("he-IL").format(Math.round(x));
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const pos = (x: number) => x.toFixed(1);
const fmtDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
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
  env: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GSC_SITE_URL"],
  async fetchData(env, fetchImpl, now) {
    const s = await loadGsc(env, fetchImpl, now);
    const cols = ["קליקים", "חשיפות", "CTR", "מיקום"];
    const row = (label: string, r: { clicks: number; impressions: number; ctr: number; position: number }) => [
      label, int(r.clicks), int(r.impressions), pct(r.ctr), pos(r.position),
    ];
    return {
      fetchedAt: new Date().toISOString(),
      // LRI…PDI keeps the date span left-to-right inside the Hebrew sentence.
      range: `\u2066${fmtDate(s.range.startDate)}–${fmtDate(s.range.endDate)}\u2069 (28 ימים, שעון פסיפיק)`,
      totals: s.totals
        ? [
            { label: "קליקים", value: int(s.totals.clicks) },
            { label: "חשיפות", value: int(s.totals.impressions) },
            { label: "CTR", value: pct(s.totals.ctr) },
            { label: "מיקום ממוצע", value: pos(s.totals.position) },
          ]
        : [],
      tables: [
        { title: "שאילתות מובילות", columns: ["שאילתה", ...cols], rows: s.topQueries.map((r) => row(r.keys[0] ?? "", r)), empty: "אין שאילתות בטווח." },
        { title: "עמודים מובילים", columns: ["עמוד", ...cols], rows: s.topPages.map((r) => row(shortPage(r.keys[0] ?? ""), r)), ltrFirstColumn: true, empty: "אין עמודים בטווח." },
      ],
      note: "ב-Search Console יש עיכוב של כ-2–3 ימים, לכן הטווח מסתיים 3 ימים לפני היום.",
      link: { href: "/admin/stats/gsc-weekly.csv", label: "הורדת CSV שבועי (7 ימים מול 7 קודמים)" },
    };
  },
};

export const GA4_PROVIDER: StatsProvider = {
  id: "ga4",
  title: "Google Analytics 4 · חיפוש אורגני",
  env: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID"],
  async fetchData(env, fetchImpl) {
    const s = await loadGa4(env, fetchImpl);
    return {
      fetchedAt: new Date().toISOString(),
      range: "28 הימים האחרונים עד אתמול (לפי אזור הזמן של הנכס)",
      totals: s.totalSessions === null ? [] : [{ label: "סשנים מחיפוש אורגני", value: int(s.totalSessions) }],
      tables: [
        {
          title: "לפי עמוד נחיתה",
          columns: ["עמוד נחיתה", "סשנים"],
          rows: s.pages.map((p) => [p.page, int(p.sessions)]),
          ltrFirstColumn: true,
          empty: "אין סשנים אורגניים בטווח.",
        },
      ],
      note: `ערוץ: Organic Search (sessionDefaultChannelGroup). ${s.rowCount > s.pages.length ? `מוצגים ${s.pages.length} מתוך ${s.rowCount} עמודים.` : ""}`.trim(),
    };
  },
};

export const EXTRA_PROVIDERS: StatsProvider[] = [GSC_PROVIDER, GA4_PROVIDER];
export const providerById = (id: string) => EXTRA_PROVIDERS.find((p) => p.id === id);
