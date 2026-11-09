import { ConfigError, googlePost, parseServiceAccount, SCOPE_GA4 } from "./google-auth";

// GA4 Data API runReport (read-only):
// https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
export const GA4_API = "https://analyticsdata.googleapis.com/v1beta/properties";
type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export function validatePropertyId(raw: string | undefined): { ok: true; id: string } | { ok: false; error: string } {
  const v = raw?.trim().replace(/^properties\//, "") ?? "";
  if (!v) return { ok: false, error: "GA4_PROPERTY_ID חסר." };
  if (v.startsWith("G-")) return { ok: false, error: "GA4_PROPERTY_ID הוא המספר מ-Property details, לא ה-Measurement ID (G-…)." };
  if (!/^\d{5,15}$/.test(v)) return { ok: false, error: "GA4_PROPERTY_ID צריך להיות מספר בלבד." };
  return { ok: true, id: v };
}

export const ORGANIC_REPORT = {
  dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
  dimensions: [{ name: "landingPage" }],
  metrics: [{ name: "sessions" }],
  dimensionFilter: { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { matchType: "EXACT", value: "Organic Search" } } },
  orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  metricAggregations: ["TOTAL"],
  limit: 15,
};

export type Ga4Stats = { totalSessions: number | null; pages: { page: string; sessions: number }[]; rowCount: number };

const num = (v: unknown) => {
  const x = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(x) ? x : null;
};

export function mapGa4(json: unknown): Ga4Stats {
  if (typeof json !== "object" || json === null) throw new Error("unexpected GA4 response");
  const j = json as { rows?: unknown; totals?: unknown; rowCount?: unknown };
  if (j.rows !== undefined && !Array.isArray(j.rows)) throw new Error("unexpected GA4 response");
  const pages: Ga4Stats["pages"] = [];
  for (const r of (j.rows as unknown[] | undefined) ?? []) {
    const row = r as { dimensionValues?: { value?: unknown }[]; metricValues?: { value?: unknown }[] };
    const page = row?.dimensionValues?.[0]?.value;
    const sessions = num(row?.metricValues?.[0]?.value);
    if (typeof page === "string" && sessions !== null) pages.push({ page, sessions });
  }
  const totals = Array.isArray(j.totals) ? (j.totals[0] as { metricValues?: { value?: unknown }[] } | undefined) : undefined;
  const total = num(totals?.metricValues?.[0]?.value);
  return {
    totalSessions: total ?? (j.rows === undefined ? 0 : null),
    pages,
    rowCount: typeof j.rowCount === "number" ? j.rowCount : pages.length,
  };
}

export async function loadGa4(env: Record<string, string | undefined>, fetchImpl: Fetch = fetch): Promise<Ga4Stats> {
  const parsed = parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!parsed.ok) throw new ConfigError(parsed.error);
  const prop = validatePropertyId(env.GA4_PROPERTY_ID);
  if (!prop.ok) throw new ConfigError(prop.error);
  const json = await googlePost("Google Analytics", `${GA4_API}/${prop.id}:runReport`, ORGANIC_REPORT, parsed.sa, SCOPE_GA4, fetchImpl);
  return mapGa4(json);
}
