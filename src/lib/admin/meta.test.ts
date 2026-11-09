import assert from "node:assert/strict";
import test from "node:test";
import {
  appSecretProof,
  DEFAULT_GRAPH_VERSION,
  jerusalemMidnight,
  loadMeta,
  mapStatsPage,
  metaAnyFailed,
  metaErrorMessage,
  metaFingerprint,
  metaWindow,
  redact,
  resolveMetaConfig,
} from "./meta";

// Obviously fake values; no real credentials anywhere in tests.
const TOKEN = "FAKE-META-TOKEN-0123456789abcdef";
const SECRET = "fake-app-secret-xyz";
const NOW = new Date("2026-11-09T10:30:00Z"); // 12:30 in Israel
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

type Call = { url: URL; auth: string | null };
function fakeMeta(handler: (u: URL) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    calls.push({ url: u, auth: new Headers(init?.headers).get("authorization") });
    return handler(u);
  };
  return { calls, fetchImpl };
}

const hourly = (iso: string, rows: [string, number][]) => ({ aggregation: "x", start_time: iso, data: rows.map(([value, count]) => ({ value, count })) });

function happy(u: URL): Response {
  const path = u.pathname;
  if (path.endsWith("/stats")) {
    const agg = u.searchParams.get("aggregation");
    const start = Number(u.searchParams.get("start_time")) * 1000;
    const end = Number(u.searchParams.get("end_time")) * 1000;
    const inRange = (iso: string) => Date.parse(iso) >= start && Date.parse(iso) <= end;
    const rows =
      agg === "event"
        ? [
            hourly("2026-11-08T22:00:00+0000", [["PageView", 5], ["Lead", 1]]), // 00:00 on 09.11 in Israel
            hourly("2026-11-08T21:00:00+0000", [["PageView", 3]]), // 23:00 on 08.11 in Israel
            hourly("2026-10-12T21:00:00+0000", [["PageView", 2]]), // 00:00 on 13.10 in Israel (UTC+3): first day of the window
            hourly("2026-10-12T20:00:00+0000", [["PageView", 100]]), // before the window
          ]
        : [hourly("2026-11-08T22:00:00+0000", [["kidsit.ai", 6], ["www.kidsit.ai", 1]]), hourly("2026-11-08T21:00:00+0000", [["kidsit.ai", 3]])];
    return json(200, { data: rows.filter((r) => inRange(r.start_time)) });
  }
  if (path.endsWith("/act_137780457")) return json(200, { id: "act_137780457", name: "Kidsit Ads", account_status: 1 });
  return json(200, { id: "2535446663629392", name: "Kidsit Pixel", last_fired_time: "2026-11-09T10:12:00+0000" });
}

test("no token → not connected, with no network call", async () => {
  const g = fakeMeta(() => json(200, {}));
  assert.deepEqual(await loadMeta({}, g.fetchImpl, NOW), { state: "not_connected", missing: ["META_ACCESS_TOKEN"] });
  assert.deepEqual(await loadMeta({ META_ACCESS_TOKEN: "   ", META_PIXEL_ID: "1" }, g.fetchImpl, NOW), { state: "not_connected", missing: ["META_ACCESS_TOKEN"] });
  assert.equal(g.calls.length, 0);
});

test("config: pixel default, act_ prefix, version check", () => {
  const a = resolveMetaConfig({ META_ACCESS_TOKEN: TOKEN });
  assert.ok(a.ok && a.config.pixelId === "2535446663629392" && a.config.adAccountId === null && a.config.version === DEFAULT_GRAPH_VERSION);
  const b = resolveMetaConfig({ META_ACCESS_TOKEN: TOKEN, META_AD_ACCOUNT_ID: "137780457" });
  assert.ok(b.ok && b.config.adAccountId === "act_137780457");
  assert.equal(resolveMetaConfig({ META_ACCESS_TOKEN: TOKEN, META_PIXEL_ID: "abc" }).ok, false);
  assert.equal(resolveMetaConfig({ META_ACCESS_TOKEN: TOKEN, META_GRAPH_VERSION: "25" }).ok, false);
});

test("maps pixel info, daily events in Israel days, per-event and per-host totals", async () => {
  const g = fakeMeta(happy);
  const r = await loadMeta({ META_ACCESS_TOKEN: TOKEN, META_AD_ACCOUNT_ID: "act_137780457" }, g.fetchImpl, NOW);
  assert.equal(r.state, "ok");
  if (r.state !== "ok") return;
  assert.deepEqual(r.range, { startDay: "2026-10-13", endDay: "2026-11-09" });
  assert.deepEqual(r.pixel, { ok: true, data: { name: "Kidsit Pixel", lastFiredTime: "2026-11-09T10:12:00.000Z" } });
  assert.ok(r.events.ok);
  if (!r.events.ok) return;
  assert.equal(r.events.data.daily.length, 28);
  assert.deepEqual(r.events.data.daily[0], { date: "2026-10-13", value: 2, incomplete: false });
  assert.deepEqual(r.events.data.daily[1], { date: "2026-10-14", value: 0, incomplete: false });
  assert.deepEqual(r.events.data.daily[26], { date: "2026-11-08", value: 3, incomplete: false });
  assert.deepEqual(r.events.data.daily[27], { date: "2026-11-09", value: 6, incomplete: true });
  assert.deepEqual(r.events.data.byEvent, [{ label: "PageView", value: 10 }, { label: "Lead", value: 1 }]);
  assert.equal(r.events.data.total, 11);
  assert.deepEqual(r.hosts, { ok: true, data: [{ label: "kidsit.ai", value: 9 }, { label: "www.kidsit.ai", value: 1 }] });
  assert.deepEqual(r.adAccount, { ok: true, data: { id: "act_137780457", name: "Kidsit Ads", status: "פעיל" } });
  assert.equal(metaAnyFailed(r), false);
  assert.equal(r.events.ok && r.events.data.daily.reduce((a, p) => a + p.value, 0), 11);
});

test("token only in the Authorization header; never in a URL", async () => {
  const g = fakeMeta(happy);
  await loadMeta({ META_ACCESS_TOKEN: TOKEN, META_APP_SECRET: SECRET }, g.fetchImpl, NOW);
  assert.ok(g.calls.length >= 3);
  const proof = appSecretProof(TOKEN, SECRET);
  for (const c of g.calls) {
    assert.equal(c.auth, `Bearer ${TOKEN}`);
    assert.equal(c.url.toString().includes(TOKEN), false);
    assert.equal(c.url.toString().includes(SECRET), false);
    assert.equal(c.url.searchParams.get("appsecret_proof"), proof);
    assert.equal(c.url.searchParams.get("access_token"), null);
    assert.match(c.url.pathname, new RegExp(`^/${DEFAULT_GRAPH_VERSION.replace(".", "\\.")}/`));
  }
  const stats = g.calls.filter((c) => c.url.pathname.endsWith("/stats"));
  assert.deepEqual(new Set(stats.map((c) => c.url.searchParams.get("aggregation"))), new Set(["event", "host"]));
  for (const c of stats) {
    const s = Number(c.url.searchParams.get("start_time"));
    const e = Number(c.url.searchParams.get("end_time"));
    assert.ok(e > s && e - s <= 7 * 86400);
  }
});

test("appsecret_proof is HMAC-SHA256 of the token keyed with the app secret", () => {
  assert.equal(appSecretProof("abc", "key"), "9c196e32dc0175f86f4b1cb89289d6619de6bee699e4c378e68309ed97a1a6ab");
});

test("API errors → safe messages; neither the token nor Meta's text appears anywhere", async () => {
  const cases: [number, unknown, RegExp][] = [
    [400, { error: { message: `Error validating access token: ${TOKEN}`, type: "OAuthException", code: 190, error_subcode: 463 } }, /190\/463.*טוקן חדש/],
    [403, { error: { message: `(#200) Missing permission ${TOKEN}`, code: 200 } }, /ads_read/],
    [400, { error: { message: `Unsupported get request ${TOKEN}`, code: 100, error_subcode: 33 } }, /100\/33/],
    [400, { error: { message: TOKEN, code: 17 } }, /קצב/],
    [500, `<html>${TOKEN}</html>`, /HTTP 500/],
  ];
  for (const [status, body, re] of cases) {
    const g = fakeMeta(() => json(status, body));
    const r = await loadMeta({ META_ACCESS_TOKEN: TOKEN, META_AD_ACCOUNT_ID: "137780457", META_APP_SECRET: SECRET }, g.fetchImpl, NOW);
    assert.equal(r.state, "ok");
    if (r.state !== "ok") return;
    for (const s of [r.pixel, r.events, r.hosts, r.adAccount!]) assert.ok(!s.ok && re.test(s.error), JSON.stringify(s));
    const all = JSON.stringify(r);
    assert.equal(all.includes(TOKEN), false);
    assert.equal(all.includes(SECRET), false);
    assert.equal(all.includes("OAuthException") || all.includes("validating"), false);
    assert.equal(metaAnyFailed(r), true);
  }
});

test("network failure and odd JSON → safe messages", async () => {
  const down = fakeMeta(() => {
    throw new Error(`connect ECONNREFUSED ${TOKEN}`);
  });
  const a = await loadMeta({ META_ACCESS_TOKEN: TOKEN }, down.fetchImpl, NOW);
  assert.ok(a.state === "ok" && !a.pixel.ok && a.pixel.error === "אין תקשורת עם Meta כרגע.");
  assert.equal(JSON.stringify(a).includes(TOKEN), false);
  const odd = fakeMeta(() => json(200, { nope: true }));
  const b = await loadMeta({ META_ACCESS_TOKEN: TOKEN }, odd.fetchImpl, NOW);
  assert.ok(b.state === "ok" && !b.events.ok && /פורמט לא צפוי/.test(b.events.error));
});

test("partial failure: host split fails, the rest still shows (and the result counts as failed)", async () => {
  const g = fakeMeta((u) => (u.searchParams.get("aggregation") === "host" ? json(400, { error: { code: 100 } }) : happy(u)));
  const r = await loadMeta({ META_ACCESS_TOKEN: TOKEN }, g.fetchImpl, NOW);
  assert.ok(r.state === "ok" && r.pixel.ok && r.events.ok && !r.hosts.ok && r.adAccount === null);
  assert.ok(r.state === "ok" && !r.hosts.ok && /קוד 100/.test(r.hosts.error) && /aggregation=host/.test(r.hosts.error));
  assert.equal(metaAnyFailed(r), true);
});

test("paging: follows graph.facebook.com next links, ignores other hosts, dedupes repeats", async () => {
  let pages = 0;
  const g = fakeMeta((u) => {
    if (!u.pathname.endsWith("/stats")) return happy(u);
    const isNext = u.searchParams.has("after");
    if (!isNext && (u.searchParams.get("aggregation") !== "event" || Number(u.searchParams.get("end_time")) * 1000 !== NOW.getTime())) return json(200, { data: [] });
    if (!isNext) {
      pages++;
      return json(200, {
        data: [hourly("2026-11-09T05:00:00+0000", [["PageView", 4]])],
        paging: { next: `https://graph.facebook.com/v25.0/2535446663629392/stats?after=X&access_token=${TOKEN}` },
      });
    }
    pages++;
    return json(200, {
      data: [hourly("2026-11-09T05:00:00+0000", [["PageView", 4]]), hourly("2026-11-09T06:00:00+0000", [["Lead", 2]])],
      paging: { next: "https://evil.example/steal" },
    });
  });
  const r = await loadMeta({ META_ACCESS_TOKEN: TOKEN }, g.fetchImpl, NOW);
  assert.equal(pages, 2);
  assert.ok(r.state === "ok" && r.events.ok && r.events.data.total === 6);
  assert.ok(g.calls.every((c) => c.url.hostname === "graph.facebook.com" && c.url.searchParams.get("access_token") === null));
});

test("cache key: fingerprint changes with the token, never contains it", () => {
  const cfg = (t: string) => {
    const r = resolveMetaConfig({ META_ACCESS_TOKEN: t });
    assert.ok(r.ok);
    return r.ok ? r.config : (null as never);
  };
  const a = metaFingerprint(cfg(TOKEN));
  assert.match(a, /^[0-9a-f]{12}$/);
  assert.equal(a, metaFingerprint(cfg(TOKEN)));
  assert.notEqual(a, metaFingerprint(cfg(TOKEN + "x")));
  assert.equal(TOKEN.includes(a), false);
});

test("helpers: redact, Israel midnight across DST, error mapping, stats page mapping", () => {
  assert.equal(redact(`a ${TOKEN} b ${TOKEN}`, [TOKEN, null]), "a [redacted] b [redacted]");
  assert.equal(new Date(jerusalemMidnight("2026-11-09")).toISOString(), "2026-11-08T22:00:00.000Z");
  assert.equal(new Date(jerusalemMidnight("2026-07-01")).toISOString(), "2026-06-30T21:00:00.000Z");
  const w = metaWindow(NOW);
  assert.equal(w.chunks.length, 4);
  assert.equal(w.chunks[3].end, NOW.getTime());
  assert.match(metaErrorMessage(429, null, null), /קצב/);
  assert.match(metaErrorMessage(400, 999, null), /קוד 999/);
  assert.deepEqual(mapStatsPage({ data: [{ start_time: "2026-11-09T05:00:00+0000", data: [{ value: "PageView", count: "3" }, { count: 1 }, { value: "x", count: -1 }] }] }), {
    buckets: [
      { hour: "2026-11-09T05:00:00.000Z", value: "PageView", count: 3 },
      { hour: "2026-11-09T05:00:00.000Z", value: "(לא ידוע)", count: 1 },
    ],
    next: null,
  });
  assert.throws(() => mapStatsPage([]), /unexpected/);
});
