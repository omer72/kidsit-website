import assert from "node:assert/strict";
import test from "node:test";
import { allowRequest, clientIpFromHeaders, consumeCommentSlot, hashIp, COMMENT_RATE_LIMIT } from "./rate-limit";

test("clientIpFromHeaders: first x-forwarded-for hop, else x-real-ip", () => {
  assert.equal(clientIpFromHeaders(new Headers({ "x-forwarded-for": " 1.1.1.1, 8.8.8.8 " })), "1.1.1.1");
  assert.equal(clientIpFromHeaders(new Headers({ "x-real-ip": "9.9.9.9" })), "9.9.9.9");
  assert.equal(clientIpFromHeaders(new Headers({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "9.9.9.9" })), "1.1.1.1");
  assert.equal(clientIpFromHeaders(new Headers()), null);
});

test("hashIp is stable and does not return the raw IP", () => {
  const a = hashIp("1.1.1.1");
  assert.equal(a, hashIp("1.1.1.1"));
  assert.notEqual(a, hashIp("8.8.8.8"));
  assert.equal(a.length, 64);
  assert.ok(!a.includes("1.1.1.1"));
});

test("allowRequest caps attempts inside the window, then allows after it slides", () => {
  const store = new Map<string, number[]>();
  const start = 1_700_000_000_000;
  for (let i = 0; i < COMMENT_RATE_LIMIT.max; i++) {
    assert.equal(allowRequest("a", start + i, COMMENT_RATE_LIMIT.windowMs, COMMENT_RATE_LIMIT.max, store), true);
  }
  assert.equal(allowRequest("a", start + COMMENT_RATE_LIMIT.max, COMMENT_RATE_LIMIT.windowMs, COMMENT_RATE_LIMIT.max, store), false);
  assert.equal(allowRequest("b", start, COMMENT_RATE_LIMIT.windowMs, COMMENT_RATE_LIMIT.max, store), true);
  assert.equal(
    allowRequest("a", start + COMMENT_RATE_LIMIT.windowMs + 1, COMMENT_RATE_LIMIT.windowMs, COMMENT_RATE_LIMIT.max, store),
    true,
  );
});

test("consumeCommentSlot isolates IPs and still caps missing IPs on a shared unknown key", () => {
  const store = new Map<string, number[]>();
  const now = 1_700_000_000_000;
  for (let i = 0; i < COMMENT_RATE_LIMIT.max; i++) {
    assert.equal(consumeCommentSlot("1.1.1.1", now + i, store), true);
  }
  assert.equal(consumeCommentSlot("1.1.1.1", now + 10, store), false);
  assert.equal(consumeCommentSlot("8.8.8.8", now, store), true);
  for (let i = 0; i < COMMENT_RATE_LIMIT.max; i++) {
    assert.equal(consumeCommentSlot(null, now + i, store), true);
  }
  assert.equal(consumeCommentSlot(null, now + 10, store), false);
});
