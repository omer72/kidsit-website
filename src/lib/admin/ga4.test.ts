import assert from "node:assert/strict";
import test from "node:test";
import { loadGa4, mapGa4, ORGANIC_REPORT, validatePropertyId } from "./ga4";
import { clearTokenCache, GoogleApiError } from "./google-auth";
import { fakeGoogle, json, TEST_EMAIL, TEST_PEM, testServiceAccountJson } from "./google-test-helpers";

const ENV = { GOOGLE_SERVICE_ACCOUNT_JSON: testServiceAccountJson(), GA4_PROPERTY_ID: "123456789" };

test("GA4_PROPERTY_ID: digits only, not the G- measurement id", () => {
  assert.deepEqual(validatePropertyId("123456789"), { ok: true, id: "123456789" });
  assert.deepEqual(validatePropertyId("properties/123456789"), { ok: true, id: "123456789" });
  assert.match((validatePropertyId("G-MJH3YYBHJ0") as { error: string }).error, /Measurement ID/);
  assert.equal(validatePropertyId("12ab").ok, false);
  assert.equal(validatePropertyId(undefined).ok, false);
});

test("mapGa4: landing pages, totals, and an empty report", () => {
  const r = mapGa4({
    rows: [
      { dimensionValues: [{ value: "/he" }], metricValues: [{ value: "42" }] },
      { dimensionValues: [{ value: "/he/blog/x" }], metricValues: [{ value: "7" }] },
    ],
    totals: [{ dimensionValues: [{ value: "RESERVED_TOTAL" }], metricValues: [{ value: "60" }] }],
    rowCount: 9,
  });
  assert.deepEqual(r, { totalSessions: 60, pages: [{ page: "/he", sessions: 42 }, { page: "/he/blog/x", sessions: 7 }], rowCount: 9 });
  assert.deepEqual(mapGa4({ kind: "analyticsData#runReport" }), { totalSessions: 0, pages: [], rowCount: 0 });
  assert.throws(() => mapGa4({ rows: {} }), /unexpected/);
});

test("loadGa4 sends the Organic Search runReport with the analytics.readonly scope", async () => {
  clearTokenCache();
  const g = fakeGoogle(() => json(200, { rows: [], totals: [{ metricValues: [{ value: "0" }] }] }));
  const r = await loadGa4(ENV, g.fetchImpl);
  assert.equal(r.totalSessions, 0);
  const api = g.calls.find((c) => c.url.includes("analyticsdata"))!;
  assert.equal(api.url, "https://analyticsdata.googleapis.com/v1beta/properties/123456789:runReport");
  assert.deepEqual(api.body, ORGANIC_REPORT);
  assert.deepEqual((api.body as typeof ORGANIC_REPORT).dimensionFilter.filter, {
    fieldName: "sessionDefaultChannelGroup",
    stringFilter: { matchType: "EXACT", value: "Organic Search" },
  });
  const scope = JSON.parse(Buffer.from(new URLSearchParams(g.calls[0].body as string).get("assertion")!.split(".")[1], "base64url").toString()).scope;
  assert.equal(scope, "https://www.googleapis.com/auth/analytics.readonly");
});

test("GA4 403 names the service account email (to add it as Viewer) but never the key", async () => {
  clearTokenCache();
  const g = fakeGoogle(() => json(403, { error: { message: "denied " + TEST_PEM } }));
  await assert.rejects(loadGa4(ENV, g.fetchImpl), (e: unknown) => {
    assert.ok(e instanceof GoogleApiError);
    assert.ok(e.message.includes(TEST_EMAIL));
    assert.ok(!e.message.includes("PRIVATE KEY"));
    return true;
  });
});
