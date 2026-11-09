import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, SESSION_COOKIE } from "./auth";
import { exportAllowed, exportTokenOk } from "./export-auth";

// Test-only values.
const PW = "test-only-stats-password";
const TOKEN = "test-only-export-token-0123456789abcdef";
const NOW = 1_800_000_000;
const req = (cookie?: string, auth?: string) => ({
  cookie: (n: string) => (n === SESSION_COOKIE ? cookie : undefined),
  header: (n: string) => (n === "authorization" ? auth ?? null : null),
});

test("CSV export needs the stats session cookie…", () => {
  const env = { STATS_PASSWORD: PW };
  assert.equal(exportAllowed(req(createSessionToken(PW, NOW)), env, NOW), true);
  assert.equal(exportAllowed(req(), env, NOW), false);
  assert.equal(exportAllowed(req("123.abc"), env, NOW), false);
  assert.equal(exportAllowed(req(createSessionToken(PW, NOW)), {}, NOW), false, "no STATS_PASSWORD → closed");
});

test("…or the optional bearer token, only when STATS_EXPORT_TOKEN is long enough", () => {
  assert.equal(exportAllowed(req(undefined, `Bearer ${TOKEN}`), { STATS_EXPORT_TOKEN: TOKEN }, NOW), true);
  assert.equal(exportAllowed(req(undefined, `Bearer ${TOKEN}x`), { STATS_EXPORT_TOKEN: TOKEN }, NOW), false);
  assert.equal(exportAllowed(req(undefined, TOKEN), { STATS_EXPORT_TOKEN: TOKEN }, NOW), false, "Bearer prefix required");
  assert.equal(exportTokenOk("Bearer short", "short"), false, "tokens under 32 chars are ignored");
  assert.equal(exportTokenOk(null, TOKEN), false);
  assert.equal(exportTokenOk(`Bearer ${TOKEN}`, undefined), false);
});
