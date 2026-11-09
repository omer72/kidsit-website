import assert from "node:assert/strict";
import test from "node:test";
import { allSectionsFailed, DEFAULT_PROJECT_ID, loadRevenueCat, mapDaily, mapOverview, mapSegmentTotals, RC_API } from "./revenuecat";

// Fixtures follow the real v2 response shapes (checked read-only against the Kidsit project), with made-up numbers.
const OVERVIEW = {
  object: "overview_metrics",
  currency: "USD",
  metrics: [
    { object: "overview_metric", id: "active_trials", name: "Active Trials", unit: "#", period: "P0D", value: 3 },
    { object: "overview_metric", id: "active_subscriptions", name: "Active Subscriptions", unit: "#", period: "P0D", value: 1 },
    { object: "overview_metric", id: "mrr", name: "MRR", unit: "$", period: "P28D", value: 12.5 },
    { object: "overview_metric", id: "revenue", name: "Revenue", unit: "$", period: "P28D", value: 40 },
    { object: "overview_metric", id: "new_customers", name: "New Customers", unit: "#", period: "P28D", value: 35 },
    { object: "overview_metric", id: "active_users", name: "Active Users", unit: "#", period: "P28D", value: 40 },
    { object: "overview_metric", id: "broken", name: "Broken", unit: "#", period: "P0D", value: null },
  ],
};
const DAILY = {
  object: "chart_data",
  resolution: "day",
  values: [
    { cohort: 1794182400, incomplete: true, measure: 0, value: 1 },
    { cohort: 1794096000, incomplete: false, measure: 0, value: 4 },
    { cohort: 1794096000, incomplete: false, measure: 1, value: 99 },
  ],
};
const SEGMENTED = {
  object: "chart_data",
  values: [],
  summary: { total: { Total: { "New Customers": 5 }, iOS: { "New Customers": 3 }, Android: { "New Customers": 2 }, "": { "New Customers": 0 } } },
  segments: [
    { display_name: "Total", is_total: true },
    { display_name: "iOS", is_total: false },
    { display_name: "Android", is_total: false },
  ],
};

test("mapOverview keeps numeric metrics and the currency", () => {
  const o = mapOverview(OVERVIEW);
  assert.equal(o.currency, "USD");
  assert.deepEqual(
    o.metrics.map((m) => [m.id, m.value, m.unit]),
    [
      ["active_trials", 3, "#"],
      ["active_subscriptions", 1, "#"],
      ["mrr", 12.5, "$"],
      ["revenue", 40, "$"],
      ["new_customers", 35, "#"],
      ["active_users", 40, "#"],
    ],
  );
  assert.throws(() => mapOverview({ nope: 1 }), /unexpected/);
});

test("mapDaily turns cohorts into sorted UTC days, first measure only", () => {
  assert.deepEqual(mapDaily(DAILY), [
    { date: "2026-11-08", value: 4, incomplete: false },
    { date: "2026-11-09", value: 1, incomplete: true },
  ]);
  assert.throws(() => mapDaily({}), /unexpected/);
});

test("mapSegmentTotals drops the Total row and labels empty segments", () => {
  assert.deepEqual(mapSegmentTotals(SEGMENTED), [
    { label: "iOS", value: 3 },
    { label: "Android", value: 2 },
    { label: "(ללא ערך)", value: 0 },
  ]);
  assert.throws(() => mapSegmentTotals({ summary: {} }), /unexpected/);
});

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("loadRevenueCat: no key means not connected and no network call", async () => {
  let calls = 0;
  const r = await loadRevenueCat({}, async () => {
    calls++;
    return respond(200, {});
  });
  assert.deepEqual(r, { state: "not_connected", missing: ["REVENUECAT_SECRET_KEY"] });
  assert.equal(calls, 0);
});

test("loadRevenueCat: bad project id is a config error, not a request", async () => {
  const r = await loadRevenueCat({ REVENUECAT_SECRET_KEY: "sk_test_fake", REVENUECAT_PROJECT_ID: "../x" }, async () => respond(200, {}));
  assert.equal(r.state, "invalid_config");
});

test("loadRevenueCat: maps a mocked API, defaults the project id, sends the key only as a bearer header", async () => {
  const urls: string[] = [];
  const auth = new Set<string>();
  const fake = async (url: string, init?: RequestInit) => {
    urls.push(url);
    auth.add(new Headers(init?.headers).get("authorization") ?? "");
    const u = new URL(url);
    if (u.pathname.endsWith("/metrics/overview")) return respond(200, OVERVIEW);
    if (u.searchParams.get("segment")) return respond(200, SEGMENTED);
    return respond(200, DAILY);
  };
  const r = await loadRevenueCat({ REVENUECAT_SECRET_KEY: "sk_test_fake" }, fake, new Date("2026-11-09T10:00:00Z"));
  assert.equal(r.state, "ok");
  if (r.state !== "ok") return;
  assert.equal(r.projectId, DEFAULT_PROJECT_ID);
  assert.equal(r.currency, "USD");
  assert.ok(r.overview.ok && r.overview.data.length === 6);
  assert.ok(r.dailyNewCustomers.ok && r.dailyNewCustomers.data.length === 2);
  assert.ok(r.customersByPlatform.ok && r.customersByPlatform.data[0].label === "iOS");
  assert.equal(urls.length, 7, "one overview + six chart calls");
  assert.ok(urls.every((u) => u.startsWith(`${RC_API}/projects/${DEFAULT_PROJECT_ID}/`)));
  assert.ok(urls.every((u) => !u.includes("sk_test_fake")), "key never in the URL");
  assert.deepEqual(Array.from(auth), ["Bearer sk_test_fake"]);
  const daily = new URL(urls.find((u) => u.includes("/charts/customers_new?") && !u.includes("segment="))!);
  assert.equal(daily.searchParams.get("start_date"), "2026-10-13");
  assert.equal(daily.searchParams.get("end_date"), "2026-11-09");
  assert.equal(daily.searchParams.get("resolution"), "0");
  const seg = urls.map((u) => new URL(u).searchParams.get("segment")).filter(Boolean).sort();
  assert.deepEqual(seg, ["attribution_campaign", "attribution_source", "platform", "platform"]);
});

test("loadRevenueCat: HTTP and network failures become per-section errors without leaking the key", async () => {
  const fake = async (url: string) => {
    if (url.includes("/metrics/overview")) return respond(403, { message: "denied sk_test_fake" });
    if (url.includes("segment=platform")) throw new Error("socket hang up sk_test_fake");
    if (url.includes("segment=")) return respond(429, {});
    return respond(200, { weird: true });
  };
  const r = await loadRevenueCat({ REVENUECAT_SECRET_KEY: "sk_test_fake" }, fake);
  assert.equal(r.state, "ok");
  if (r.state !== "ok") return;
  assert.ok(!r.overview.ok && /403/.test(r.overview.error));
  assert.ok(!r.customersByPlatform.ok && r.customersByPlatform.error === "החיבור ל-RevenueCat נכשל.");
  assert.ok(!r.customersBySource.ok && /429/.test(r.customersBySource.error));
  assert.ok(!r.dailyNewCustomers.ok && /לא צפוי/.test(r.dailyNewCustomers.error));
  assert.ok(!JSON.stringify(r).includes("sk_test_fake"));
  assert.equal(allSectionsFailed(r), true);
});

test("allSectionsFailed is true only when every call failed", async () => {
  const r = await loadRevenueCat({ REVENUECAT_SECRET_KEY: "sk_test_fake" }, async () => respond(401, {}));
  assert.ok(r.state === "ok" && allSectionsFailed(r));
  if (r.state === "ok") assert.ok(!r.overview.ok && /401/.test(r.overview.error));
  const partial = await loadRevenueCat({ REVENUECAT_SECRET_KEY: "sk_test_fake" }, async (url: string) =>
    url.includes("/metrics/overview") ? respond(200, OVERVIEW) : respond(500, {}),
  );
  assert.ok(partial.state === "ok" && !allSectionsFailed(partial));
});
