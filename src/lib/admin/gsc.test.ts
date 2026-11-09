import assert from "node:assert/strict";
import test from "node:test";
import { addDays, gscWindow } from "./dates";
import { clearTokenCache } from "./google-auth";
import { csvText, loadGsc, loadGscWeekly, mapGscRows, mergeWeeks, validateSiteUrl, weeklyCsv, WEEKLY_HEADER } from "./gsc";
import { fakeGoogle, json, testServiceAccountJson } from "./google-test-helpers";

const ENV = { GOOGLE_SERVICE_ACCOUNT_JSON: testServiceAccountJson(), GSC_SITE_URL: "https://kidsit.ai/" };
const NOW = new Date("2026-11-09T12:00:00Z"); // 04:00 on 9 Nov in Pacific Time

test("GSC_SITE_URL must be the URL-prefix property with a trailing slash", () => {
  assert.deepEqual(validateSiteUrl("https://kidsit.ai/"), { ok: true, siteUrl: "https://kidsit.ai/" });
  for (const bad of [undefined, "", "https://kidsit.ai", "sc-domain:kidsit.ai", "kidsit.ai/", "https://kidsit.ai/he/"])
    assert.equal(validateSiteUrl(bad).ok, false, String(bad));
});

test("date windows end 3 days before today (Pacific) and don't overlap", () => {
  assert.deepEqual(gscWindow(28, NOW), { startDate: "2026-10-10", endDate: "2026-11-06" });
  assert.deepEqual(gscWindow(7, NOW), { startDate: "2026-10-31", endDate: "2026-11-06" });
  assert.deepEqual(gscWindow(7, NOW, 7), { startDate: "2026-10-24", endDate: "2026-10-30" });
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("mapGscRows: rows, empty range, and bad shapes", () => {
  assert.deepEqual(mapGscRows({ rows: [{ keys: ["ילד"], clicks: 3, impressions: 40, ctr: 0.075, position: 6.2 }] }), [
    { keys: ["ילד"], clicks: 3, impressions: 40, ctr: 0.075, position: 6.2 },
  ]);
  assert.deepEqual(mapGscRows({ responseAggregationType: "byProperty" }), []);
  assert.throws(() => mapGscRows({ rows: "x" }), /unexpected/);
  assert.throws(() => mapGscRows(null), /unexpected/);
});

test("loadGsc: three read-only queries on the encoded site URL with finalized data", async () => {
  clearTokenCache();
  const g = fakeGoogle((_url, body) => {
    const dims = (body as { dimensions?: string[] }).dimensions;
    if (!dims) return json(200, { rows: [{ clicks: 12, impressions: 300, ctr: 0.04, position: 9.5 }] });
    if (dims[0] === "query") return json(200, { rows: [{ keys: ["הורות"], clicks: 5, impressions: 50, ctr: 0.1, position: 4 }] });
    return json(200, { rows: [{ keys: ["https://kidsit.ai/he/blog/x"], clicks: 7, impressions: 90, ctr: 0.078, position: 5.1 }] });
  });
  const s = await loadGsc(ENV, g.fetchImpl, NOW);
  assert.deepEqual(s.range, { startDate: "2026-10-10", endDate: "2026-11-06" });
  assert.deepEqual(s.totals, { clicks: 12, impressions: 300, ctr: 0.04, position: 9.5 });
  assert.equal(s.topQueries[0].keys[0], "הורות");
  assert.equal(s.topPages[0].clicks, 7);
  const api = g.calls.filter((c) => !c.url.includes("oauth2"));
  assert.equal(api.length, 3);
  for (const c of api) {
    assert.equal(c.url, "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fkidsit.ai%2F/searchAnalytics/query");
    assert.equal((c.body as { dataState: string }).dataState, "final");
    assert.equal(new Headers(c.init?.headers).get("authorization"), "Bearer ya29.test-token");
  }
  const scope = JSON.parse(Buffer.from(new URLSearchParams(g.calls[0].body as string).get("assertion")!.split(".")[1], "base64url").toString()).scope;
  assert.equal(scope, "https://www.googleapis.com/auth/webmasters.readonly");
});

test("mergeWeeks + weeklyCsv: deltas, missing weeks, sorting", () => {
  const rows = mergeWeeks(
    [
      { keys: ["a", "https://kidsit.ai/he"], clicks: 5, impressions: 100, ctr: 0.05, position: 3.25 },
      { keys: ["new", "https://kidsit.ai/en"], clicks: 1, impressions: 10, ctr: 0.1, position: 8 },
    ],
    [
      { keys: ["a", "https://kidsit.ai/he"], clicks: 2, impressions: 80, ctr: 0.025, position: 4.5 },
      { keys: ["gone", "https://kidsit.ai/he/blog"], clicks: 3, impressions: 30, ctr: 0.1, position: 2 },
    ],
  );
  assert.deepEqual(rows.map((r) => r.query), ["a", "new", "gone"]);
  const csv = weeklyCsv(rows);
  assert.ok(csv.startsWith("\uFEFF" + WEEKLY_HEADER.join(",") + "\r\n"));
  const lines = csv.slice(1).trim().split("\r\n");
  assert.equal(lines[1], '"a","https://kidsit.ai/he",5,2,3,100,80,20,0.05,0.025,0.025,3.3,4.5,-1.2');
  assert.equal(lines[2], '"new","https://kidsit.ai/en",1,0,1,10,0,10,0.1,,,8,,');
  assert.equal(lines[3], '"gone","https://kidsit.ai/he/blog",0,3,-3,0,30,-30,,0.1,,,2,');
});

test("csvText quotes, doubles quotes and defuses formula prefixes", () => {
  assert.equal(csvText("plain"), '"plain"');
  assert.equal(csvText('say "hi", ok'), '"say ""hi"", ok"');
  assert.equal(csvText("=HYPERLINK(\"x\")"), '"\'=HYPERLINK(""x"")"');
  for (const p of ["+1", "-1", "@SUM(A1)", "\tx", "\rx"]) assert.ok(csvText(p).startsWith(`"'`), p);
  assert.equal(csvText("ילד מרביץ"), '"ילד מרביץ"');
  const csv = weeklyCsv([{ query: "=cmd|' /C calc'!A0", page: "https://kidsit.ai/", last: { clicks: 1, impressions: 1, ctr: 1, position: 1 }, prev: null }]);
  assert.ok(csv.includes(`"'=cmd|' /C calc'!A0"`));
});

test("loadGscWeekly asks for query+page on two consecutive 7-day windows", async () => {
  clearTokenCache();
  const g = fakeGoogle((_u, body) => {
    const b = body as { startDate: string; dimensions: string[]; rowLimit: number };
    assert.deepEqual(b.dimensions, ["query", "page"]);
    assert.equal(b.rowLimit, 5000);
    return json(200, { rows: [{ keys: [b.startDate, "https://kidsit.ai/"], clicks: 1, impressions: 2, ctr: 0.5, position: 1 }] });
  });
  const w = await loadGscWeekly(ENV, g.fetchImpl, NOW);
  assert.deepEqual(w.lastWeek, { startDate: "2026-10-31", endDate: "2026-11-06" });
  assert.deepEqual(w.prevWeek, { startDate: "2026-10-24", endDate: "2026-10-30" });
  assert.equal(w.rows.length, 2);
});
