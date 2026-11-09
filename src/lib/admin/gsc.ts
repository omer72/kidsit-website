import { ConfigError, googlePost, parseServiceAccount, SCOPE_GSC, type ServiceAccount } from "./google-auth";
import { gscWindow } from "./dates";

// Search Console Search Analytics (read-only): https://developers.google.com/webmaster-tools/v1/searchanalytics/query
export const GSC_API = "https://www.googleapis.com/webmasters/v3/sites";
type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

/** URL-prefix property with a trailing slash, e.g. https://kidsit.ai/ (not sc-domain:). */
export function validateSiteUrl(raw: string | undefined): { ok: true; siteUrl: string } | { ok: false; error: string } {
  const v = raw?.trim() ?? "";
  if (!v) return { ok: false, error: "GSC_SITE_URL חסר." };
  if (v.startsWith("sc-domain:")) return { ok: false, error: "GSC_SITE_URL צריך להיות נכס URL-prefix, למשל https://kidsit.ai/ (לא sc-domain:)." };
  if (!/^https?:\/\/[a-z0-9.-]+(:\d+)?\/$/i.test(v)) return { ok: false, error: "GSC_SITE_URL צריך להיות בדיוק כתובת הנכס עם / בסוף, למשל https://kidsit.ai/." };
  return { ok: true, siteUrl: v };
}

const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);

export function mapGscRows(json: unknown): GscRow[] {
  if (typeof json !== "object" || json === null) throw new Error("unexpected GSC response");
  const rows = (json as { rows?: unknown }).rows;
  if (rows === undefined) return []; // no data in the range
  if (!Array.isArray(rows)) throw new Error("unexpected GSC response");
  return rows
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => ({
      keys: Array.isArray(r.keys) ? r.keys.map((k) => String(k)) : [],
      clicks: n(r.clicks),
      impressions: n(r.impressions),
      ctr: n(r.ctr),
      position: n(r.position),
    }));
}

export async function gscQuery(
  sa: ServiceAccount,
  siteUrl: string,
  body: { startDate: string; endDate: string; dimensions?: string[]; rowLimit?: number },
  fetchImpl: Fetch = fetch,
): Promise<GscRow[]> {
  const url = `${GSC_API}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  return mapGscRows(await googlePost("Search Console", url, { ...body, dataState: "final" }, sa, SCOPE_GSC, fetchImpl));
}

export type GscStats = {
  range: { startDate: string; endDate: string };
  totals: Omit<GscRow, "keys"> | null;
  topQueries: GscRow[];
  topPages: GscRow[];
};

export async function loadGsc(env: Record<string, string | undefined>, fetchImpl: Fetch = fetch, now = new Date()): Promise<GscStats> {
  const parsed = parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!parsed.ok) throw new ConfigError(parsed.error);
  const site = validateSiteUrl(env.GSC_SITE_URL);
  if (!site.ok) throw new ConfigError(site.error);
  const range = gscWindow(28, now);
  const [totals, topQueries, topPages] = await Promise.all([
    gscQuery(parsed.sa, site.siteUrl, { ...range }, fetchImpl),
    gscQuery(parsed.sa, site.siteUrl, { ...range, dimensions: ["query"], rowLimit: 10 }, fetchImpl),
    gscQuery(parsed.sa, site.siteUrl, { ...range, dimensions: ["page"], rowLimit: 10 }, fetchImpl),
  ]);
  const t = totals[0];
  return {
    range,
    totals: t ? { clicks: t.clicks, impressions: t.impressions, ctr: t.ctr, position: t.position } : null,
    topQueries,
    topPages,
  };
}

// ---- Weekly CSV: last 7 days vs the 7 before, by query + page ----

export type WeeklyRow = { query: string; page: string; last: Omit<GscRow, "keys"> | null; prev: Omit<GscRow, "keys"> | null };

export function mergeWeeks(last: GscRow[], prev: GscRow[]): WeeklyRow[] {
  const map = new Map<string, WeeklyRow>();
  const key = (r: GscRow) => JSON.stringify([r.keys[0] ?? "", r.keys[1] ?? ""]);
  const strip = ({ clicks, impressions, ctr, position }: GscRow) => ({ clicks, impressions, ctr, position });
  for (const r of last) map.set(key(r), { query: r.keys[0] ?? "", page: r.keys[1] ?? "", last: strip(r), prev: null });
  for (const r of prev) {
    const k = key(r);
    const hit = map.get(k);
    if (hit) hit.prev = strip(r);
    else map.set(k, { query: r.keys[0] ?? "", page: r.keys[1] ?? "", last: null, prev: strip(r) });
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      (b.last?.clicks ?? 0) - (a.last?.clicks ?? 0) ||
      (b.last?.impressions ?? 0) - (a.last?.impressions ?? 0) ||
      (b.prev?.clicks ?? 0) - (a.prev?.clicks ?? 0) ||
      a.query.localeCompare(b.query),
  );
}

/** RFC 4180 quoting plus a guard against spreadsheet formula injection for text cells. */
export function csvText(v: string): string {
  const guarded = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${guarded.replace(/"/g, '""')}"`;
}

const fixed = (x: number, d: number) => (Math.round(x * 10 ** d) / 10 ** d).toString();

export const WEEKLY_HEADER = [
  "query", "page",
  "clicks_last7", "clicks_prev7", "clicks_delta",
  "impressions_last7", "impressions_prev7", "impressions_delta",
  "ctr_last7", "ctr_prev7", "ctr_delta",
  "position_last7", "position_prev7", "position_delta",
];

export function weeklyCsv(rows: WeeklyRow[]): string {
  const lines = [WEEKLY_HEADER.join(",")];
  for (const r of rows) {
    const lc = r.last?.clicks ?? 0, pc = r.prev?.clicks ?? 0;
    const li = r.last?.impressions ?? 0, pi = r.prev?.impressions ?? 0;
    // CTR and position don't exist for a week without impressions: leave those cells (and the delta) empty.
    const ctrL = r.last ? fixed(r.last.ctr, 4) : "", ctrP = r.prev ? fixed(r.prev.ctr, 4) : "";
    const posL = r.last ? fixed(r.last.position, 1) : "", posP = r.prev ? fixed(r.prev.position, 1) : "";
    lines.push(
      [
        csvText(r.query), csvText(r.page),
        lc, pc, lc - pc,
        li, pi, li - pi,
        ctrL, ctrP, r.last && r.prev ? fixed(r.last.ctr - r.prev.ctr, 4) : "",
        posL, posP, r.last && r.prev ? fixed(r.last.position - r.prev.position, 1) : "",
      ].join(","),
    );
  }
  // BOM so Excel opens Hebrew queries as UTF-8.
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

export async function loadGscWeekly(env: Record<string, string | undefined>, fetchImpl: Fetch = fetch, now = new Date()) {
  const parsed = parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!parsed.ok) throw new ConfigError(parsed.error);
  const site = validateSiteUrl(env.GSC_SITE_URL);
  if (!site.ok) throw new ConfigError(site.error);
  const lastWeek = gscWindow(7, now);
  const prevWeek = gscWindow(7, now, 7);
  const q = (r: { startDate: string; endDate: string }) =>
    gscQuery(parsed.sa, site.siteUrl, { ...r, dimensions: ["query", "page"], rowLimit: 5000 }, fetchImpl);
  const [last, prev] = await Promise.all([q(lastWeek), q(prevWeek)]);
  return { lastWeek, prevWeek, rows: mergeWeeks(last, prev) };
}
