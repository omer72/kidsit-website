import assert from "node:assert/strict";
import test from "node:test";
import {
  configuredSecret,
  createSessionToken,
  SESSION_TTL_S,
  sessionCookieOptions,
  verifyPassword,
  verifySessionToken,
} from "./auth";

// Test-only values; never a real password.
const SECRET = "test-only-not-a-real-password";
const NOW = 1_800_000_000;

test("unset or blank STATS_PASSWORD denies everything", () => {
  assert.equal(configuredSecret(undefined), null);
  assert.equal(configuredSecret("   "), null);
  assert.equal(verifyPassword("anything", null), false);
  assert.equal(verifyPassword("", configuredSecret("")), false);
  assert.equal(verifySessionToken(createSessionToken(SECRET, NOW), null, NOW), false);
});

test("password check accepts only the exact password", () => {
  assert.equal(verifyPassword(SECRET, SECRET), true);
  assert.equal(verifyPassword(SECRET + " ", SECRET), false);
  assert.equal(verifyPassword("test-only", SECRET), false);
  assert.equal(verifyPassword("", SECRET), false);
  assert.equal(verifyPassword(null, SECRET), false);
  assert.equal(verifyPassword("x".repeat(600), SECRET), false);
});

test("session token never contains the password and verifies until expiry", () => {
  const token = createSessionToken(SECRET, NOW);
  assert.ok(!token.includes(SECRET));
  assert.match(token, /^\d+\.[0-9a-f]{64}$/);
  assert.equal(verifySessionToken(token, SECRET, NOW), true);
  assert.equal(verifySessionToken(token, SECRET, NOW + SESSION_TTL_S - 1), true);
  assert.equal(verifySessionToken(token, SECRET, NOW + SESSION_TTL_S), false);
});

test("session token is rejected after a password change or tampering", () => {
  const token = createSessionToken(SECRET, NOW);
  assert.equal(verifySessionToken(token, "test-only-other-password", NOW), false);
  const [exp, mac] = token.split(".");
  assert.equal(verifySessionToken(`${Number(exp) + 1000}.${mac}`, SECRET, NOW), false);
  assert.equal(verifySessionToken(`${exp}.${mac.slice(0, -1)}${mac.endsWith("0") ? "1" : "0"}`, SECRET, NOW), false);
  assert.equal(verifySessionToken("garbage", SECRET, NOW), false);
  assert.equal(verifySessionToken(undefined, SECRET, NOW), false);
  // A token that claims an expiry far beyond what we issue is refused even with a valid MAC.
  const far = createSessionToken(SECRET, NOW + 10 * SESSION_TTL_S);
  assert.equal(verifySessionToken(far, SECRET, NOW), false);
});

test("cookie is httpOnly, secure, sameSite strict and scoped to /admin", () => {
  assert.equal(sessionCookieOptions.httpOnly, true);
  assert.equal(sessionCookieOptions.secure, true);
  assert.equal(sessionCookieOptions.sameSite, "strict");
  assert.equal(sessionCookieOptions.path, "/admin");
});

test("/admin is not rewritten onto /he or /en; /api still bypasses; pages still localize", async () => {
  const { shouldBypassLocale } = await import("../locale-bypass");
  assert.equal(shouldBypassLocale("/admin"), true);
  assert.equal(shouldBypassLocale("/admin/stats"), true);
  assert.equal(shouldBypassLocale("/api/insights"), true);
  assert.equal(shouldBypassLocale("/administrator"), false);
  assert.equal(shouldBypassLocale("/privacy"), false);
});
