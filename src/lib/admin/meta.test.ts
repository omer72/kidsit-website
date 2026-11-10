import assert from "node:assert/strict";
import test from "node:test";
import {
  appSecretProof,
  DEFAULT_GRAPH_VERSION,
  loadMeta,
  metaAnyFailed,
  metaErrorMessage,
  metaFingerprint,
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

function happy(u: URL): Response {
  const path = u.pathname;
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

test("maps pixel info and ad account status; no stats calls", async () => {
  const g = fakeMeta(happy);
  const r = await loadMeta({ META_ACCESS_TOKEN: TOKEN, META_AD_ACCOUNT_ID: "act_137780457" }, g.fetchImpl, NOW);
  assert.equal(r.state, "ok");
  if (r.state !== "ok") return;
  assert.deepEqual(r.pixel, { ok: true, data: { name: "Kidsit Pixel", lastFiredTime: "2026-11-09T10:12:00.000Z" } });
  assert.deepEqual(r.adAccount, { ok: true, data: { id: "act_137780457", name: "Kidsit Ads", status: "פעיל" } });
  assert.equal(metaAnyFailed(r), false);
  assert.equal(g.calls.length, 2);
  assert.ok(g.calls.every((c) => !c.url.pathname.endsWith("/stats")));
});

test("token only in the Authorization header; never in a URL", async () => {
  const g = fakeMeta(happy);
  await loadMeta({ META_ACCESS_TOKEN: TOKEN, META_APP_SECRET: SECRET, META_AD_ACCOUNT_ID: "137780457" }, g.fetchImpl, NOW);
  assert.equal(g.calls.length, 2);
  const proof = appSecretProof(TOKEN, SECRET);
  for (const c of g.calls) {
    assert.equal(c.auth, `Bearer ${TOKEN}`);
    assert.equal(c.url.toString().includes(TOKEN), false);
    assert.equal(c.url.toString().includes(SECRET), false);
    assert.equal(c.url.searchParams.get("appsecret_proof"), proof);
    assert.equal(c.url.searchParams.get("access_token"), null);
    assert.match(c.url.pathname, new RegExp(`^/${DEFAULT_GRAPH_VERSION.replace(".", "\\.")}/`));
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
    for (const s of [r.pixel, r.adAccount!]) assert.ok(!s.ok && re.test(s.error), JSON.stringify(s));
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
  const odd = fakeMeta(() => json(200, "nope"));
  const b = await loadMeta({ META_ACCESS_TOKEN: TOKEN }, odd.fetchImpl, NOW);
  assert.ok(b.state === "ok" && !b.pixel.ok && /פורמט לא צפוי/.test(b.pixel.error));
});

test("partial failure: ad account fails, the pixel still shows (and the result counts as failed)", async () => {
  const g = fakeMeta((u) => (u.pathname.endsWith("/act_137780457") ? json(403, { error: { code: 200 } }) : happy(u)));
  const r = await loadMeta({ META_ACCESS_TOKEN: TOKEN, META_AD_ACCOUNT_ID: "137780457" }, g.fetchImpl, NOW);
  assert.ok(r.state === "ok" && r.pixel.ok && r.adAccount !== null && !r.adAccount.ok && /ads_read/.test(r.adAccount.error));
  assert.equal(metaAnyFailed(r), true);
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

test("helpers: redact, error mapping", () => {
  assert.equal(redact(`a ${TOKEN} b ${TOKEN}`, [TOKEN, null]), "a [redacted] b [redacted]");
  assert.match(metaErrorMessage(429, null, null), /קצב/);
  assert.match(metaErrorMessage(400, 999, null), /קוד 999/);
});
