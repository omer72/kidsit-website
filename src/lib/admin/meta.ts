// Read-only Meta Graph API client for the Meta Pixel card on /admin/stats. Server-side only.
// Endpoints (https://developers.facebook.com/docs/marketing-api/reference/ads-pixel/ and …/ads-pixel/stats/):
//   GET /{pixel-id}?fields=name,last_fired_time
//   GET /{pixel-id}/stats?aggregation=event|host&start_time=…&end_time=…  (unix seconds; hourly buckets:
//       { data: [{ aggregation, start_time, data: [{ value, count }] }], paging })
//   GET /act_{ad-account-id}?fields=name,account_status                    (optional access check)
// The token travels only in the Authorization header. It never goes into a URL, a log line, an error or the cache key;
// errors are built from Meta's numeric codes, never from Meta's message text.
import { createHash, createHmac } from "node:crypto";
import { META_PIXEL_ID } from "../meta-pixel";
import { addDays, dayInZone } from "./dates";
import type { DailyPoint, Section, SegmentTotal } from "./revenuecat";

export const META_GRAPH = "https://graph.facebook.com";
/** Pinned. Checked against developers.facebook.com on 2026-11-09; override with META_GRAPH_VERSION. */
export const DEFAULT_GRAPH_VERSION = "v25.0";
export const META_WINDOW_DAYS = 28;
/** Ask for at most 7 days per stats call, then merge (the stats docs mention a 7-day limit). */
const CHUNK_DAYS = 7;
const MAX_PAGES = 20;
const TZ = "Asia/Jerusalem";

type Env = Record<string, string | undefined>;
type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export type MetaConfig = { token: string; pixelId: string; adAccountId: string | null; appSecret: string | null; version: string };
export type EventStats = { daily: DailyPoint[]; byEvent: SegmentTotal[]; total: number };
export type MetaStats =
  | { state: "not_connected"; missing: string[] }
  | { state: "invalid_config"; error: string }
  | {
      state: "ok";
      fetchedAt: string;
      pixelId: string;
      range: { startDay: string; endDay: string };
      pixel: Section<{ name: string | null; lastFiredTime: string | null }>;
      events: Section<EventStats>;
      hosts: Section<SegmentTotal[]>;
      adAccount: Section<{ id: string; name: string | null; status: string }> | null;
    };

export class MetaApiError extends Error {}

export function resolveMetaConfig(env: Env): { ok: true; config: MetaConfig } | { ok: false; missing?: string[]; error?: string } {
  const token = env.META_ACCESS_TOKEN?.trim() || "";
  if (!token) return { ok: false, missing: ["META_ACCESS_TOKEN"] };
  const pixelId = env.META_PIXEL_ID?.trim() || META_PIXEL_ID;
  if (!/^\d{5,25}$/.test(pixelId)) return { ok: false, error: "META_PIXEL_ID צריך להיות מספר (מזהה הפיקסל / ה-Dataset)." };
  const rawAct = env.META_AD_ACCOUNT_ID?.trim() || "";
  const actDigits = rawAct.replace(/^act_/, "");
  if (rawAct && !/^\d{3,25}$/.test(actDigits)) return { ok: false, error: "META_AD_ACCOUNT_ID צריך להיות בפורמט act_123 או מספר." };
  const version = env.META_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
  if (!/^v\d{1,3}\.\d$/.test(version)) return { ok: false, error: "META_GRAPH_VERSION צריך להיות בפורמט v25.0." };
  return {
    ok: true,
    config: { token, pixelId, adAccountId: rawAct ? `act_${actDigits}` : null, appSecret: env.META_APP_SECRET?.trim() || null, version },
  };
}

/** Cache-key fingerprint: a hash of everything that changes the answer. The token itself never becomes part of a key. */
export function metaFingerprint(c: MetaConfig): string {
  const h = createHash("sha256");
  for (const v of [c.token, c.pixelId, c.adAccountId ?? "", c.appSecret ?? "", c.version]) h.update(v).update("\0");
  return h.digest("hex").slice(0, 12);
}

/** appsecret_proof = HMAC-SHA256(token) keyed with the app secret (Graph API "Secure Requests"). */
export const appSecretProof = (token: string, appSecret: string) => createHmac("sha256", appSecret).update(token).digest("hex");

/** Belt and braces: strip any secret that might appear in a string. */
export function redact(s: string, secrets: (string | null | undefined)[]): string {
  let out = s;
  for (const x of secrets) if (x && x.length >= 4) out = out.split(x).join("[redacted]");
  return out;
}

/** Hebrew, secret-free message from a Graph error code. Meta's own message text is never shown. */
export function metaErrorMessage(status: number, code: number | null, subcode: number | null): string {
  if (code === 190 || status === 401)
    return `הטוקן של Meta לא תקף (פג תוקף, בוטל או שגוי; קוד 190${subcode ? `/${subcode}` : ""}). צריך ליצור טוקן חדש ל-System User ולעדכן את META_ACCESS_TOKEN.`;
  if (code === 10 || code === 200 || (code !== null && code >= 200 && code < 300) || status === 403)
    return `אין הרשאה (קוד ${code ?? status}). ודאו שה-System User משויך לפיקסל עם הרשאת צפייה ושלטוקן יש ads_read.`;
  if (code === 100 && subcode === 33)
    return "Meta לא מוצאת את האובייקט או שאין הרשאה אליו (קוד 100/33). בדקו את המזהה ואת שיוך הנכס ל-System User.";
  if (code === 4 || code === 17 || code === 32 || code === 613 || code === 80004 || status === 429)
    return `Meta מגבילה כרגע את קצב הקריאות (קוד ${code ?? status}). ננסה שוב בטעינה הבאה.`;
  if (code === 100) return "פרמטר לא תקין בבקשה ל-Meta (קוד 100).";
  return `Meta החזירה שגיאה (${code !== null ? `קוד ${code}` : `HTTP ${status}`}).`;
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;
const intOrNull = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);

async function graphGet(c: MetaConfig, url: URL, fetchImpl: Fetch): Promise<unknown> {
  url.searchParams.delete("access_token");
  if (c.appSecret) url.searchParams.set("appsecret_proof", appSecretProof(c.token, c.appSecret));
  let res: Response;
  try {
    res = await fetchImpl(url.toString(), { headers: { Authorization: `Bearer ${c.token}`, Accept: "application/json" }, cache: "no-store" });
  } catch {
    throw new MetaApiError("אין תקשורת עם Meta כרגע.");
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const err = isObj(body) && isObj(body.error) ? body.error : null;
  if (!res.ok || err) throw new MetaApiError(metaErrorMessage(res.status, intOrNull(err?.code), intOrNull(err?.error_subcode)));
  if (!isObj(body)) throw new Error("unexpected Meta response");
  return body;
}

const graphUrl = (c: MetaConfig, path: string, params: Record<string, string>) => {
  const u = new URL(`${META_GRAPH}/${c.version}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u;
};

/** Epoch ms of local midnight in Asia/Jerusalem for a YYYY-MM-DD day. */
export function jerusalemMidnight(day: string): number {
  const guess = Date.parse(`${day}T00:00:00Z`);
  const offsetAt = (t: number) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
        .formatToParts(new Date(t))
        .map((x) => [x.type, x.value]),
    );
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t;
  };
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t);
  return t;
}

export function metaWindow(now: Date) {
  const endDay = dayInZone(TZ, now);
  const startDay = addDays(endDay, -(META_WINDOW_DAYS - 1));
  const start = jerusalemMidnight(startDay);
  const chunks: { start: number; end: number }[] = [];
  for (let s = start; s < now.getTime(); s += CHUNK_DAYS * 864e5) chunks.push({ start: s, end: Math.min(s + CHUNK_DAYS * 864e5, now.getTime()) });
  return { startDay, endDay, start, chunks };
}

type Bucket = { hour: string; value: string; count: number };

/** Map one stats page: [{ start_time, data: [{ value, count }] }] → flat hourly buckets. */
export function mapStatsPage(json: unknown): { buckets: Bucket[]; next: string | null } {
  if (!isObj(json) || !Array.isArray(json.data)) throw new Error("unexpected stats response");
  const buckets: Bucket[] = [];
  for (const r of json.data) {
    if (!isObj(r) || typeof r.start_time !== "string" || !Array.isArray(r.data)) continue;
    const hour = new Date(r.start_time);
    if (Number.isNaN(hour.getTime())) continue;
    for (const d of r.data) {
      if (!isObj(d)) continue;
      const count = typeof d.count === "number" ? d.count : typeof d.count === "string" ? Number(d.count) : NaN;
      if (!Number.isFinite(count) || count < 0) continue;
      buckets.push({ hour: hour.toISOString(), value: typeof d.value === "string" && d.value ? d.value : "(לא ידוע)", count });
    }
  }
  const next = isObj(json.paging) && typeof json.paging.next === "string" ? json.paging.next : null;
  return { buckets, next };
}

async function loadAggregation(c: MetaConfig, aggregation: "event" | "host", win: ReturnType<typeof metaWindow>, fetchImpl: Fetch) {
  // Keyed by hour+value so overlapping chunk edges or repeated pages are counted once.
  const seen = new Map<string, Bucket>();
  await Promise.all(
    win.chunks.map(async (ch) => {
      let url: URL | null = graphUrl(c, `${c.pixelId}/stats`, {
        aggregation,
        start_time: String(Math.floor(ch.start / 1000)),
        end_time: String(Math.floor(ch.end / 1000)),
      });
      for (let page = 0; url && page < MAX_PAGES; page++) {
        const { buckets, next } = mapStatsPage(await graphGet(c, url, fetchImpl));
        for (const b of buckets) seen.set(`${b.hour}\0${b.value}`, b);
        url = null;
        if (next) {
          const n = new URL(next);
          if (n.origin === META_GRAPH) url = n;
        }
      }
    }),
  );
  return Array.from(seen.values()).filter((b) => {
    const t = Date.parse(b.hour);
    return t >= win.start && t < win.chunks[win.chunks.length - 1].end;
  });
}

const totalsBy = (buckets: Bucket[]): SegmentTotal[] => {
  const m = new Map<string, number>();
  for (const b of buckets) m.set(b.value, (m.get(b.value) ?? 0) + b.count);
  return Array.from(m, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
};

export function mapEvents(buckets: Bucket[], win: { startDay: string; endDay: string }): EventStats {
  const perDay = new Map<string, number>();
  for (let d = win.startDay; d <= win.endDay; d = addDays(d, 1)) perDay.set(d, 0);
  for (const b of buckets) {
    const day = dayInZone(TZ, new Date(b.hour));
    if (perDay.has(day)) perDay.set(day, (perDay.get(day) ?? 0) + b.count);
  }
  const daily = Array.from(perDay, ([date, value]) => ({ date, value, incomplete: date === win.endDay }));
  const byEvent = totalsBy(buckets);
  return { daily, byEvent, total: byEvent.reduce((a, r) => a + r.value, 0) };
}

const ACCOUNT_STATUS: Record<number, string> = { 1: "פעיל", 2: "מושבת", 3: "חוב פתוח", 7: "בבדיקת סיכון", 8: "ממתין לסגירה", 9: "בתקופת חסד", 100: "ממתין לסגירה", 101: "סגור" };

async function section<T>(fn: () => Promise<T>, secrets: (string | null)[]): Promise<Section<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    const msg = e instanceof MetaApiError ? e.message : e instanceof Error && /^unexpected /.test(e.message) ? "תשובה בפורמט לא צפוי מ-Meta." : "טעינת הנתונים מ-Meta נכשלה.";
    return { ok: false, error: redact(msg, secrets) };
  }
}

export async function loadMeta(env: Env, fetchImpl: Fetch = fetch, now: Date = new Date()): Promise<MetaStats> {
  const r = resolveMetaConfig(env);
  if (!r.ok) return r.missing ? { state: "not_connected", missing: r.missing } : { state: "invalid_config", error: r.error ?? "הגדרה לא תקינה." };
  const c = r.config;
  const secrets = [c.token, c.appSecret, c.appSecret ? appSecretProof(c.token, c.appSecret) : null];
  const win = metaWindow(now);

  const [pixel, events, hosts, adAccount] = await Promise.all([
    section(async () => {
      const j = (await graphGet(c, graphUrl(c, c.pixelId, { fields: "name,last_fired_time" }), fetchImpl)) as Record<string, unknown>;
      const fired = typeof j.last_fired_time === "string" && !Number.isNaN(Date.parse(j.last_fired_time)) ? new Date(j.last_fired_time).toISOString() : null;
      return { name: typeof j.name === "string" ? j.name : null, lastFiredTime: fired };
    }, secrets),
    section(async () => mapEvents(await loadAggregation(c, "event", win, fetchImpl), win), secrets),
    section(async () => totalsBy(await loadAggregation(c, "host", win, fetchImpl)), secrets),
    c.adAccountId
      ? section(async () => {
          const j = (await graphGet(c, graphUrl(c, c.adAccountId!, { fields: "name,account_status" }), fetchImpl)) as Record<string, unknown>;
          const st = intOrNull(j.account_status);
          return { id: c.adAccountId!, name: typeof j.name === "string" ? j.name : null, status: st === null ? "לא ידוע" : ACCOUNT_STATUS[st] ?? `סטטוס ${st}` };
        }, secrets)
      : Promise.resolve(null),
  ]);

  // aggregation=host is documented, but if Meta rejects the parameter, say the split may not be available.
  const hostsOut: typeof hosts =
    !hosts.ok && hosts.error.includes("(קוד 100)") ? { ok: false, error: `${hosts.error} ייתכן שהחלוקה לפי דומיין (aggregation=host) לא זמינה לפיקסל הזה.` } : hosts;

  return { state: "ok", fetchedAt: now.toISOString(), pixelId: c.pixelId, range: { startDay: win.startDay, endDay: win.endDay }, pixel, events, hosts: hostsOut, adAccount };
}

export const metaAnyFailed = (s: MetaStats) =>
  s.state === "ok" && [s.pixel, s.events, s.hosts, s.adAccount].some((x) => x !== null && !x.ok);
