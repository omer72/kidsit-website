// Read-only RevenueCat REST API v2 client for /admin/stats. Server-side only: the secret key must never reach the browser.
// Endpoints (https://www.revenuecat.com/docs/api-v2/charts-and-metrics):
//   GET /v2/projects/{id}/metrics/overview     needs charts_metrics:overview:read
//   GET /v2/projects/{id}/charts/{chart_name}  needs charts_metrics:charts:read
// Charts & Metrics share a default limit of 25 requests/minute per project; one page load makes 7 calls, cached 15 min.

export const RC_API = "https://api.revenuecat.com/v2";
export const DEFAULT_PROJECT_ID = "projd8712292";
export const WINDOW_DAYS = 28;

export type Section<T> = { ok: true; data: T } | { ok: false; error: string };
export type OverviewMetric = { id: string; name: string; value: number; unit: string; period: string };
export type DailyPoint = { date: string; value: number; incomplete: boolean };
export type SegmentTotal = { label: string; value: number };

export type RevenueCatStats =
  | { state: "not_connected"; missing: string[] }
  | { state: "invalid_config"; error: string }
  | {
      state: "ok";
      projectId: string;
      fetchedAt: string;
      currency: string | null;
      overview: Section<OverviewMetric[]>;
      dailyNewCustomers: Section<DailyPoint[]>;
      dailyNewTrials: Section<DailyPoint[]>;
      customersByPlatform: Section<SegmentTotal[]>;
      trialsByPlatform: Section<SegmentTotal[]>;
      customersBySource: Section<SegmentTotal[]>;
      customersByCampaign: Section<SegmentTotal[]>;
    };

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export const isProjectId = (id: string) => /^proj[0-9a-z]{4,64}$/i.test(id);

export function resolveConfig(env: Record<string, string | undefined>) {
  const key = env.REVENUECAT_SECRET_KEY?.trim() || "";
  const projectId = env.REVENUECAT_PROJECT_ID?.trim() || DEFAULT_PROJECT_ID;
  return { key, projectId };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;
const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);

export function mapOverview(json: unknown): { metrics: OverviewMetric[]; currency: string | null } {
  if (!isObj(json) || !Array.isArray(json.metrics)) throw new Error("unexpected overview response");
  const metrics: OverviewMetric[] = [];
  for (const m of json.metrics) {
    if (!isObj(m) || typeof m.id !== "string") continue;
    const value = num(m.value);
    if (value === null) continue;
    metrics.push({
      id: m.id,
      name: typeof m.name === "string" ? m.name : m.id,
      value,
      unit: typeof m.unit === "string" ? m.unit : "",
      period: typeof m.period === "string" ? m.period : "",
    });
  }
  return { metrics, currency: typeof json.currency === "string" ? json.currency : null };
}

/** Unsegmented daily chart: values are {cohort: unix seconds (UTC day start), measure, value, incomplete}. */
export function mapDaily(json: unknown): DailyPoint[] {
  if (!isObj(json) || !Array.isArray(json.values)) throw new Error("unexpected chart response");
  const out: DailyPoint[] = [];
  for (const v of json.values) {
    if (!isObj(v)) continue;
    const cohort = num(v.cohort);
    const value = num(v.value);
    if (cohort === null || value === null || (v.measure !== undefined && v.measure !== 0)) continue;
    if (v.segment !== undefined) continue;
    out.push({ date: new Date(cohort * 1000).toISOString().slice(0, 10), value, incomplete: v.incomplete === true });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Segmented chart requested with aggregate=total: summary.total = { "<segment>": { "<measure>": n }, "Total": {...} }. */
export function mapSegmentTotals(json: unknown): SegmentTotal[] {
  if (!isObj(json) || !isObj(json.summary) || !isObj(json.summary.total)) throw new Error("unexpected segmented response");
  const totalNames = new Set<string>(["Total"]);
  if (Array.isArray(json.segments))
    for (const s of json.segments) if (isObj(s) && s.is_total === true && typeof s.display_name === "string") totalNames.add(s.display_name);
  const out: SegmentTotal[] = [];
  for (const [label, measures] of Object.entries(json.summary.total)) {
    if (totalNames.has(label) || !isObj(measures)) continue;
    const first = Object.values(measures).map(num).find((n) => n !== null);
    if (first === undefined || first === null) continue;
    out.push({ label: label.trim() || "(ללא ערך)", value: first });
  }
  return out.sort((a, b) => b.value - a.value);
}

export function describeHttpError(status: number): string {
  if (status === 401) return "המפתח נדחה (401). בדקו את REVENUECAT_SECRET_KEY.";
  if (status === 403) return "אין הרשאה (403). למפתח חסרה הרשאת קריאה ל-Charts & Metrics.";
  if (status === 404) return "הפרויקט לא נמצא (404). בדקו את REVENUECAT_PROJECT_ID.";
  if (status === 429) return "חריגה ממגבלת הקריאות של RevenueCat (429). נסו שוב בעוד דקה.";
  return `שגיאה מ-RevenueCat (HTTP ${status}).`;
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export async function loadRevenueCat(
  env: Record<string, string | undefined>,
  fetchImpl: Fetch = fetch,
  now: Date = new Date(),
): Promise<RevenueCatStats> {
  const { key, projectId } = resolveConfig(env);
  if (!key) return { state: "not_connected", missing: ["REVENUECAT_SECRET_KEY"] };
  if (!isProjectId(projectId)) return { state: "invalid_config", error: "REVENUECAT_PROJECT_ID לא בפורמט proj…" };

  const base = `${RC_API}/projects/${encodeURIComponent(projectId)}`;
  const get = async <T>(path: string, map: (j: unknown) => T): Promise<Section<T>> => {
    try {
      // The page caches the whole result (unstable_cache), so each request goes to the network.
      const res = await fetchImpl(base + path, {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return { ok: false, error: describeHttpError(res.status) };
      return { ok: true, data: map(await res.json()) };
    } catch (e) {
      // Never echo request details (they carry the key header); only a short reason.
      const msg = e instanceof Error && /^unexpected /.test(e.message) ? "תשובה בפורמט לא צפוי מ-RevenueCat." : "החיבור ל-RevenueCat נכשל.";
      return { ok: false, error: msg };
    }
  };

  const end = isoDate(now);
  const start = isoDate(new Date(now.getTime() - (WINDOW_DAYS - 1) * 86_400_000));
  const chart = (name: string, extra: Record<string, string> = {}) =>
    `/charts/${name}?` + new URLSearchParams({ resolution: "0", start_date: start, end_date: end, ...extra }).toString();
  const totals = (segment: string) => ({ segment, aggregate: "total", limit_num_segments: "10" });

  const meta: { currency: string | null } = { currency: null };
  const [overview, dailyNewCustomers, dailyNewTrials, customersByPlatform, trialsByPlatform, customersBySource, customersByCampaign] =
    await Promise.all([
      get("/metrics/overview", (j) => {
        const o = mapOverview(j);
        meta.currency = o.currency;
        return o.metrics;
      }),
      get(chart("customers_new"), mapDaily),
      get(chart("trials_new"), mapDaily),
      get(chart("customers_new", totals("platform")), mapSegmentTotals),
      get(chart("trials_new", totals("platform")), mapSegmentTotals),
      get(chart("customers_new", totals("attribution_source")), mapSegmentTotals),
      get(chart("customers_new", totals("attribution_campaign")), mapSegmentTotals),
    ]);

  return {
    state: "ok",
    projectId,
    fetchedAt: now.toISOString(),
    currency: meta.currency,
    overview,
    dailyNewCustomers,
    dailyNewTrials,
    customersByPlatform,
    trialsByPlatform,
    customersBySource,
    customersByCampaign,
  };
}

const SECTION_KEYS = [
  "overview",
  "dailyNewCustomers",
  "dailyNewTrials",
  "customersByPlatform",
  "trialsByPlatform",
  "customersBySource",
  "customersByCampaign",
] as const;

/** True when every API call failed (nothing worth caching). */
export function allSectionsFailed(r: Extract<RevenueCatStats, { state: "ok" }>): boolean {
  return SECTION_KEYS.every((k) => !r[k].ok);
}
