import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../app/api/funnel/route";

// No DATABASE_URL here, so a payload that passes validation stops at 503 before any storage call and
// nothing is ever written. 400 means the payload was rejected.
async function post(body: unknown) {
  const saved = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const res = await POST(
      new Request("http://localhost/api/funnel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    );
    return { status: res.status, json: (await res.json()) as { error?: string; issues?: { path: string; code: string }[] } };
  } finally {
    if (saved !== undefined) process.env.DATABASE_URL = saved;
  }
}

test("route: the 1.0.14 app payloads pass validation (503 only because no database is configured here)", async () => {
  for (const body of [
    { v: 1, step: "moment_sent", platform: "ios", lang: "he", app_version: "1.0.14" },
    { v: 1, step: "moment_sent", platform: "android", app_version: "1.0", source: "google-play" },
    { v: 1, step: "paywall_shown", platform: "ios", app_version: "1.0.14", entry: "first_moment" },
    { v: 1, step: "paywall_shown", platform: "android", app_version: "1.0.14", source: "kidsit.ai", entry: "free_limit" },
    { v: 1, step: "paywall_shown", app_version: "1.0.14" },
  ]) {
    const r = await post(body);
    assert.equal(r.status, 503, JSON.stringify(body));
    assert.equal(r.json.error, "funnel_storage_unconfigured");
  }
});

test("route: entry on another step, a bad entry, or a bad version is a 400", async () => {
  const cases: [Record<string, unknown>, string, string][] = [
    [{ v: 1, step: "paywall_dismissed", entry: "settings" }, "entry", "not_allowed_for_step"],
    [{ v: 1, step: "purchase", entry: "first_moment" }, "entry", "not_allowed_for_step"],
    [{ v: 1, step: "paywall_shown", entry: "somewhere" }, "entry", "invalid"],
    [{ v: 1, step: "paywall_shown", app_version: "1.0.14.1" }, "app_version", "invalid"],
  ];
  for (const [body, path, code] of cases) {
    const r = await post(body);
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.ok(r.json.issues?.some((i) => i.path === path && i.code === code), JSON.stringify(body));
  }
});
