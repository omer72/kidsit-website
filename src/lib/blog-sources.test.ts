import { test } from "node:test";
import assert from "node:assert/strict";
import { getPost } from "./blog";

const CDC_URL = "https://www.cdc.gov/parenting-toddlers/time-out/steps.html";

function cdcSources(post: NonNullable<ReturnType<typeof getPost>>) {
  return post.sources.filter((s) => /cdc\.gov/i.test(s.url) || /\bCDC\b/.test(s.publisher ?? "") || /centers for disease control/i.test(`${s.title} ${s.publisher ?? ""}`));
}

test("the Hebrew time-out post lists the CDC source at the same URL as the body", () => {
  const post = getPost("tayeem-aut-o-tayeem-ein", "he");
  assert.ok(post, "expected the Hebrew time-out post");
  const bodyUrls = [...post.bodyMd.matchAll(/https:\/\/www\.cdc\.gov[^)\s"]+/g)].map((m) => m[0]);
  assert.equal(bodyUrls.length, 2);
  assert.ok(bodyUrls.every((u) => u === CDC_URL));

  const listed = cdcSources(post);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].title, "How to Use Time-Out");
  assert.equal(listed[0].publisher, "CDC");
  assert.equal(listed[0].url, CDC_URL);
  assert.equal(post.sources.length, 8);
});

test("a CDC source without listCdc stays hidden, including the English time-out post", () => {
  const en = getPost("time-out-vs-time-in", "en");
  assert.ok(en, "expected the English time-out post");
  assert.equal(cdcSources(en).length, 0);
  assert.equal(en.sources.length, 9);
});
