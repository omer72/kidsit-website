import assert from "node:assert/strict";
import test from "node:test";
import { TOUCH_KEY, clickId, detectTouch, firstTouch, isPaidMedium, normalizeSource, resetTouchMemory, sourceFromReferrer } from "./attribution";

const site = "kidsit.ai";
const at = (qs: string, referrer = "") => detectTouch({ href: `https://kidsit.ai/he${qs}`, referrer, siteHost: site });

test("utm_source normalization", () => {
  for (const [raw, want] of [
    ["chatgpt.com", "ai-chatgpt"], ["ChatGPT", "ai-chatgpt"], ["chat.openai.com", "ai-chatgpt"], ["https://chatgpt.com/", "ai-chatgpt"],
    ["perplexity", "ai-perplexity"], ["perplexity.ai", "ai-perplexity"], ["gemini", "ai-gemini"], ["gemini.google.com", "ai-gemini"],
    ["copilot", "ai-copilot"], ["copilot.microsoft.com", "ai-copilot"], ["claude", "ai-claude"], ["claude.ai", "ai-claude"],
    ["google", "google"], ["fb", "facebook"], ["m.facebook.com", "facebook"], ["ig", "instagram"], ["tiktok", "tiktok"],
    ["My Newsletter!", "my-newsletter"], ["!!!", "other"],
  ]) assert.equal(normalizeSource(raw), want, raw);
});

test("referrer host mapping", () => {
  for (const [r, want] of [
    ["https://chatgpt.com/", "ai-chatgpt"], ["https://chat.openai.com/c/1", "ai-chatgpt"], ["https://www.perplexity.ai/search", "ai-perplexity"],
    ["https://gemini.google.com/app", "ai-gemini"], ["https://copilot.microsoft.com/", "ai-copilot"], ["https://claude.ai/chat/1", "ai-claude"],
    ["https://www.google.com/", "google"], ["https://www.google.co.il/", "google"], ["https://www.bing.com/search?q=x", "bing"],
    ["https://l.facebook.com/l.php?u=x", "facebook"], ["https://m.facebook.com/", "facebook"], ["https://l.instagram.com/", "instagram"],
    ["https://www.tiktok.com/", "tiktok"], ["https://kidsit.ai/en", "direct"], ["https://www.kidsit.ai/he/blog", "direct"],
    ["", "direct"], ["not a url", "direct"], ["https://news.example.org/a", "referral"],
  ]) assert.equal(sourceFromReferrer(r, site), want, r);
  assert.equal(sourceFromReferrer("http://localhost:3108/he", "localhost:3108"), "direct");
});

test("precedence: utm_source > click id > referrer > direct", () => {
  assert.equal(at("?utm_source=chatgpt.com", "https://www.google.com/").source, "ai-chatgpt");
  assert.equal(at("?gclid=abc", "https://www.perplexity.ai/").source, "google");
  assert.equal(at("", "https://www.perplexity.ai/").source, "ai-perplexity");
  assert.equal(at("").source, "direct");
  assert.equal(at("?utm_source=chatgpt.com").paid, false);
});

test("paid detection: paid mediums or any click id", () => {
  for (const m of ["cpc", "CPC", "ppc", "paid", "paid_social", "paid-social", "paidsocial", "ads", "display", "cpm", "paid_search"]) assert.ok(isPaidMedium(m), m);
  for (const m of ["organic", "social", "email", "referral", "", undefined]) assert.ok(!isPaidMedium(m), String(m));
  assert.equal(at("?gclid=1").paid, true);
  assert.equal(at("?fbclid=1").paid, true);
  assert.equal(at("?ttclid=1").paid, true);
  assert.equal(at("?utm_source=newsletter&utm_medium=email").paid, false);
});

test("captures utm_* and click ids, clipped to 100 chars", () => {
  const t = at("?utm_source=google&utm_medium=cpc&utm_campaign=c1&utm_content=v2&gclid=G&fbclid=F&ttclid=T");
  assert.deepEqual(
    [t.utm_source, t.utm_medium, t.utm_campaign, t.utm_content, t.gclid, t.fbclid, t.ttclid],
    ["google", "cpc", "c1", "v2", "G", "F", "T"],
  );
  assert.deepEqual(clickId(t), { type: "gclid", value: "G" });
  assert.equal(at("?gclid=" + "x".repeat(300)).gclid!.length, 100);
  assert.equal(clickId(at("")), null);
});

function fakeStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

test("first touch is stored once per session and wins over later landings", () => {
  resetTouchMemory();
  const s = fakeStorage();
  const a = firstTouch({ href: "https://kidsit.ai/en?utm_source=chatgpt.com", referrer: "", siteHost: site }, s);
  assert.equal(a.source, "ai-chatgpt");
  assert.ok(s.m.has(TOUCH_KEY));
  const b = firstTouch({ href: "https://kidsit.ai/en/blog?gclid=1", referrer: "https://kidsit.ai/en", siteHost: site }, s);
  assert.equal(b.source, "ai-chatgpt");
});

test("storage that throws or is missing falls back to memory", () => {
  resetTouchMemory();
  const bad = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  const a = firstTouch({ href: "https://kidsit.ai/en?utm_source=perplexity", referrer: "", siteHost: site }, bad);
  assert.equal(a.source, "ai-perplexity");
  assert.equal(firstTouch({ href: "https://kidsit.ai/en", referrer: "", siteHost: site }, null).source, "ai-perplexity");
  resetTouchMemory();
  const corrupt = { getItem: () => "{not json", setItem: () => {} };
  assert.equal(firstTouch({ href: "https://kidsit.ai/en", referrer: "", siteHost: site }, corrupt).source, "direct");
});
