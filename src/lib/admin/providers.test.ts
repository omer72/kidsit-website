import assert from "node:assert/strict";
import test from "node:test";
import { clearTokenCache } from "./google-auth";
import { EXTRA_PROVIDERS, GA4_PROVIDER, GSC_PROVIDER, runProvider, safeErrorMessage, shortPage } from "./providers";
import { fakeGoogle, json, TEST_PEM, testServiceAccountJson } from "./google-test-helpers";

const SA = testServiceAccountJson();

test("missing env → not connected, listing what's missing, with no network call", async () => {
  let calls = 0;
  const f = async () => {
    calls++;
    return json(200, {});
  };
  assert.deepEqual(await runProvider(GA4_PROVIDER, {}, f), { state: "not_connected", missing: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID"] });
  assert.deepEqual(await runProvider(GSC_PROVIDER, { GOOGLE_SERVICE_ACCOUNT_JSON: SA }, f), { state: "not_connected", missing: ["GSC_SITE_URL"] });
  assert.equal(calls, 0);
});

test("bad JSON or bad ids → a safe error card, no network call", async () => {
  let calls = 0;
  const f = async () => {
    calls++;
    return json(200, {});
  };
  const a = await runProvider(GSC_PROVIDER, { GOOGLE_SERVICE_ACCOUNT_JSON: "{oops", GSC_SITE_URL: "https://kidsit.ai/" }, f);
  assert.ok(a.state === "error" && /JSON/.test(a.error));
  const b = await runProvider(GA4_PROVIDER, { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GA4_PROPERTY_ID: "G-MJH3YYBHJ0" }, f);
  assert.ok(b.state === "error" && /Measurement ID/.test(b.error));
  const c = await runProvider(GSC_PROVIDER, { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GSC_SITE_URL: "sc-domain:kidsit.ai" }, f);
  assert.ok(c.state === "error" && /URL-prefix/.test(c.error));
  assert.equal(calls, 0);
});

test("API errors become error cards; nothing in any result contains the key", async () => {
  for (const status of [401, 403, 404, 429, 500]) {
    clearTokenCache();
    const g = fakeGoogle(() => json(status, { error: TEST_PEM }));
    for (const p of EXTRA_PROVIDERS) {
      const r = await runProvider(p, { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GA4_PROPERTY_ID: "123456789", GSC_SITE_URL: "https://kidsit.ai/" }, g.fetchImpl);
      assert.equal(r.state, "error", `${p.id} ${status}`);
      assert.ok(!JSON.stringify(r).includes("PRIVATE KEY"));
      if (r.state === "error") assert.match(r.error, new RegExp(String(status)));
    }
  }
});

test("GSC provider formats totals and tables from mocked data", async () => {
  clearTokenCache();
  const g = fakeGoogle((_u, body) =>
    (body as { dimensions?: string[] }).dimensions
      ? json(200, { rows: [{ keys: ["https://kidsit.ai/he/blog/%D7%90"], clicks: 1234, impressions: 5000, ctr: 0.2468, position: 3.14 }] })
      : json(200, { rows: [{ clicks: 1234, impressions: 5000, ctr: 0.2468, position: 3.14 }] }),
  );
  const r = await runProvider(GSC_PROVIDER, { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GSC_SITE_URL: "https://kidsit.ai/" }, g.fetchImpl, new Date("2026-11-09T12:00:00Z"));
  assert.equal(r.state, "ok");
  if (r.state !== "ok") return;
  assert.deepEqual(r.totals.map((t) => t.value), ["1,234", "5,000", "24.7%", "3.1"]);
  assert.equal(r.tables[1].rows[0][0], "/he/blog/א");
  assert.match(r.range, /10\.10\.2026–06\.11\.2026/);
  assert.equal(r.link?.href, "/admin/stats/gsc-weekly.csv");
});

test("safeErrorMessage hides unknown errors", () => {
  assert.equal(safeErrorMessage(new Error("socket " + TEST_PEM)), "טעינת הנתונים נכשלה.");
  assert.equal(shortPage("not a url"), "not a url");
});
