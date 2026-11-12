import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../../content/blog/audio-manifest.json";
import { isoDuration, listenLabel, absoluteAudioUrl } from "./blog-audio";
import { applyLexicon, audioHash, chunkText, measure, needsAudio, speechFromMarkdown, type VoiceConfig } from "./blog-audio-text";

const post = `---
date: 2026-11-02
slug: /he/blog/x
title_tag: "Title tag | Kidsit AI"
---

# The screen goes off

6:10 p.m. The episode ends. See [the full guide](/en/blog/guide) and ![a photo](/x.png) **now**.

> **Want the words for your moment?** Kidsit helps. [App Store](https://apps.apple.com/us/app/x/id1) · [Google Play](https://play.google.com/store/apps/details?id=ai.kidsit.app)

## Why it hits so hard

- Tired
- Hungry

| Option | When |
| --- | --- |
| Kidsit | In the moment |

<div class="behavior-log">

1. **When** — "Tuesday, 7:40."

</div>

## Quick questions

<!-- faq
[{"q": "Is it therapy?", "a": "No."}]
-->

## Try it next time

Kidsit AI is on iPhone and Android.

[App Store](https://apps.apple.com/us/app/x/id1) · [Google Play](https://play.google.com/store/apps/details?id=ai.kidsit.app)

---

*Not medical advice.*
`;

test("speech text: intro, title and body without markdown, links, images or front matter", () => {
  const { title, text } = speechFromMarkdown(post, "en");
  assert.equal(title, "The screen goes off");
  assert.ok(text.startsWith("From the Kidsit blog. The screen goes off.\n\n6:10 p.m. The episode ends."));
  assert.match(text, /See the full guide and now\./);
  for (const gone of ["date:", "title_tag", "](", "http", "**", "a photo", "<div", "#"]) assert.ok(!text.includes(gone), gone);
});

test("speech text: headings are their own sentence; lists, tables and HTML-wrapped lists are read as sentences", () => {
  const { text } = speechFromMarkdown(post, "en");
  assert.match(text, /\n\nWhy it hits so hard\.\n\nTired\.\nHungry\./);
  assert.match(text, /Option, When\.\nKidsit, In the moment\./);
  assert.match(text, /When — "Tuesday, 7:40\."/);
});

test("speech text: FAQ JSON and its empty heading, store promos and the download section are dropped; the disclaimer stays", () => {
  const { text } = speechFromMarkdown(post, "en");
  for (const gone of ["Is it therapy", "Quick questions", "Want the words", "Try it next time", "iPhone and Android", "App Store"]) {
    assert.ok(!text.includes(gone), gone);
  }
  assert.ok(text.endsWith("Not medical advice."));
});

test("speech text: a promo blockquote inside a content section drops only the promo", () => {
  const md = "# T\n\n## Words that work\n\nSay this.\n\n> Try it. [App Store](https://apps.apple.com/us/app/x/id1)\n\nThen this.\n";
  assert.equal(speechFromMarkdown(md, "en").text, "From the Kidsit blog. T.\n\nWords that work.\n\nSay this.\n\nThen this.");
});

test("speech text: Hebrew intro, and a title ending in a question mark gets no extra period", () => {
  assert.equal(speechFromMarkdown("# הילד מתפרק?\n\nגוף.", "he").text, "מהבלוג של Kidsit. הילד מתפרק?\n\nגוף.");
});

test("lexicon: plain and regex entries apply in file order", () => {
  const lexicon = [
    { from: "Kidsit AI", to: "קידסיט איי איי" },
    { from: "Kidsit", to: "קידסיט" },
    { from: "(?<![\\d:])18:10(?![\\d:])", to: "שש ועשרה בערב", regex: true },
  ];
  assert.equal(
    applyLexicon("מהבלוג של Kidsit. Kidsit AI. 18:10. 118:105.", lexicon),
    "מהבלוג של קידסיט. קידסיט איי איי. שש ועשרה בערב. 118:105.",
  );
  assert.equal(applyLexicon("unchanged", []), "unchanged");
});

test("chunking: only at paragraph boundaries while paragraphs fit", () => {
  const paras = ["a".repeat(40), "b".repeat(40), "c".repeat(40)];
  const chunks = chunkText(paras.join("\n\n"), 90);
  assert.deepEqual(chunks, [`${paras[0]}\n\n${paras[1]}`, paras[2]]);
});

test("chunking: an oversized paragraph falls back to sentences, then words; nothing is lost", () => {
  const long = "One two three. Four five six seven. Eight nine ten eleven twelve.";
  const chunks = chunkText(`${long}\n\nShort.`, 20);
  assert.ok(chunks.every((c) => c.length <= 20), JSON.stringify(chunks));
  assert.equal(chunks.join(" ").replace(/\s+/g, " "), `${long} Short.`);
});

test("chunking: byte limits count UTF-8 bytes, so Hebrew splits earlier than its character count", () => {
  const he = "שלום ".repeat(30).trim();
  assert.equal(measure(he, "chars"), 149);
  assert.equal(measure(he, "bytes"), 269);
  assert.ok(chunkText(he, 200, "bytes").every((c) => measure(c, "bytes") <= 200));
  assert.equal(chunkText(he, 200, "chars").length, 1);
});

test("hash: changes with text, provider, model, voice or output; stable otherwise", () => {
  const voice: VoiceConfig = { provider: "elevenlabs", model: "eleven_v4", voice: "v1", limit: { unit: "chars", max: 9000 } };
  const output = { lufs: -16 };
  const base = audioHash("text", voice, output);
  assert.equal(audioHash("text", { ...voice }, { lufs: -16 }), base);
  for (const changed of [
    audioHash("text!", voice, output),
    audioHash("text", { ...voice, provider: "google" }, output),
    audioHash("text", { ...voice, model: "eleven_v5" }, output),
    audioHash("text", { ...voice, voice: "v2" }, output),
    audioHash("text", voice, { lufs: -14 }),
  ]) {
    assert.notEqual(changed, base);
  }
});

test("manifest skip: regenerate when forced, missing or changed; skip when the hash matches", () => {
  assert.equal(needsAudio({ hash: "h" }, "h", true), false);
  assert.equal(needsAudio({ hash: "h" }, "h", true, true), true);
  assert.equal(needsAudio({ hash: "h" }, "h", false), true);
  assert.equal(needsAudio({ hash: "old" }, "h", true), true);
  assert.equal(needsAudio(undefined, "h", true), true);
});

test("listen label: whole minutes, at least one, in each language", () => {
  assert.equal(listenLabel("he", 372), "האזינו למאמר · 6 דקות");
  assert.equal(listenLabel("he", 50), "האזינו למאמר · דקה אחת");
  assert.equal(listenLabel("en", 372), "Listen to this post · 6 min");
  assert.equal(listenLabel("en", 10), "Listen to this post · 1 min");
});

test("ISO 8601 duration and absolute audio URL for schema.org", () => {
  assert.equal(isoDuration(372), "PT6M12S");
  assert.equal(isoDuration(3720), "PT1H2M");
  assert.equal(isoDuration(0), "PT0S");
  assert.equal(absoluteAudioUrl("/audio/blog/he/x.mp3"), "https://kidsit.ai/audio/blog/he/x.mp3");
  assert.equal(absoluteAudioUrl("https://cdn.example/x.mp3"), "https://cdn.example/x.mp3");
});

test("audio manifest: every file is on Vercel Blob, never a local path (public/audio/blog is not deployed)", () => {
  for (const [key, entry] of Object.entries(manifest as Record<string, { src: string }>)) {
    assert.match(entry.src, /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//, key);
  }
});
