#!/usr/bin/env node
// Phase 1 of the blog "Listen" option: render the same two paragraphs (Hebrew
// and English) with several TTS providers so Omer can pick a voice by ear.
// Generates only the comparison clips and prints the cost of voicing the blog.
//
//   OPENAI_API_KEY=... GOOGLE_TTS_API_KEY=... ELEVENLABS_API_KEY=... node scripts/tts-compare.mjs
//
// A provider without a key is skipped. Output: tmp/tts-compare/*.mp3 + index.html.

import { createSign } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "tmp/tts-compare");
const SOURCES = {
  he: "content/blog/he/kibui-masach.md",
  en: "content/blog/en/screen-time-meltdown.md",
};
const STYLE =
  "Calm, warm and unhurried, like a friend with a background in developmental psychology. " +
  "Natural pauses between sentences. Read quoted lines as something a parent says out loud, not as a list.";

// Prices from the public pricing pages, checked 2026-11-11. USD per 1,000 characters.
const PRICES = [
  {
    provider: "openai",
    label: "OpenAI gpt-4o-mini-tts",
    per1k: 0.015,
    note: "billed as $0.60/1M text tokens + $12/1M audio tokens; ~$0.015 per minute of audio, so per 1k characters is an estimate",
    url: "https://developers.openai.com/api/docs/pricing",
  },
  {
    provider: "google",
    label: "Google WaveNet",
    per1k: 0.004,
    note: "first 4M characters a month free",
    url: "https://cloud.google.com/text-to-speech/pricing",
  },
  {
    provider: "google",
    label: "Google Chirp 3: HD",
    per1k: 0.03,
    note: "first 1M characters a month free",
    url: "https://cloud.google.com/text-to-speech/pricing",
  },
  {
    provider: "elevenlabs",
    label: "ElevenLabs v4 / Multilingual v2",
    per1k: 0.08,
    note: "Hebrew is listed only for eleven_v4; plans include a monthly character allowance",
    url: "https://elevenlabs.io/pricing/api",
  },
];

// ---------- text ----------

function stripFrontMatter(md) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

function inlineToText(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// First `n` prose paragraphs after the title (no headings, lists, tables, quotes or HTML).
export function firstParagraphs(md, n = 2) {
  return stripFrontMatter(md)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !/^(#|>|\||-|\*|\d+\.|<|!\[|\{)/.test(p))
    .slice(0, n)
    .map(inlineToText);
}

// Rough spoken length of a post: body text without front matter, the FAQ JSON
// block, images, link targets or markdown syntax. Phase 2 does the exact strip.
export function spokenChars(md) {
  const text = stripFrontMatter(md)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .split("\n")
    .map((line) => inlineToText(line.replace(/^\s*(#{1,6}|>|[-*]|\d+\.)\s+/, "").replace(/\|/g, " ")))
    .filter(Boolean)
    .join("\n");
  return text.length;
}

// ---------- providers ----------

async function failText(r) {
  const t = await r.text().catch(() => "");
  return `HTTP ${r.status}: ${t.slice(0, 300)}`;
}

const openai = {
  name: "openai",
  enabled: () => !!process.env.OPENAI_API_KEY,
  missing: "OPENAI_API_KEY not set",
  async voices() {
    return { he: ["marin", "cedar"], en: ["marin", "cedar"] };
  },
  async synth(text, lang, voice) {
    const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        voice,
        input: text,
        response_format: "mp3",
        instructions: lang === "he" ? `${STYLE} Speak natural Israeli Hebrew.` : STYLE,
      }),
    });
    if (!r.ok) throw new Error(await failText(r));
    return { audio: Buffer.from(await r.arrayBuffer()), model };
  },
};

let googleToken = null;
async function googleAuth() {
  if (process.env.GOOGLE_TTS_API_KEY)
    return { query: `?key=${encodeURIComponent(process.env.GOOGLE_TTS_API_KEY)}`, headers: {} };
  if (!googleToken) {
    // Service-account JSON → signed JWT → OAuth access token (no SDK needed).
    const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
    const now = Math.floor(Date.now() / 1000);
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })}`;
    const sig = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key).toString("base64url");
    const r = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${sig}`,
      }),
    });
    if (!r.ok) throw new Error(`Google token: ${await failText(r)}`);
    googleToken = (await r.json()).access_token;
  }
  return { query: "", headers: { Authorization: `Bearer ${googleToken}` } };
}

const google = {
  name: "google",
  enabled: () => !!(process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS),
  missing: "GOOGLE_TTS_API_KEY and GOOGLE_APPLICATION_CREDENTIALS not set",
  // Hebrew has WaveNet and Chirp 3: HD voices (no Neural2 or Studio). Override with GOOGLE_TTS_VOICES_HE / _EN.
  async voices() {
    const pick = (env, dflt) => (process.env[env] ? process.env[env].split(",").map((s) => s.trim()) : dflt);
    return {
      he: pick("GOOGLE_TTS_VOICES_HE", ["he-IL-Wavenet-C", "he-IL-Chirp3-HD-Aoede"]),
      en: pick("GOOGLE_TTS_VOICES_EN", ["en-US-Neural2-F", "en-US-Chirp3-HD-Aoede"]),
    };
  },
  async synth(text, lang, voice) {
    const auth = await googleAuth();
    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize${auth.query}`, {
      method: "POST",
      headers: { ...auth.headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: lang === "he" ? "he-IL" : "en-US", name: voice },
        audioConfig: { audioEncoding: "MP3" },
      }),
    });
    if (!r.ok) throw new Error(await failText(r));
    return {
      audio: Buffer.from((await r.json()).audioContent, "base64"),
      model: voice.split("-").slice(2, -1).join("-"),
    };
  },
};

const ELEVEN = "https://api.elevenlabs.io";
let elevenModels = null;
const elevenlabs = {
  name: "elevenlabs",
  enabled: () => !!process.env.ELEVENLABS_API_KEY,
  missing: "ELEVENLABS_API_KEY not set",
  headers: () => ({ "xi-api-key": process.env.ELEVENLABS_API_KEY }),
  // Two voices: ELEVENLABS_VOICE_IDS="id1,id2", else the first two premade voices on the account.
  async voices() {
    let ids = process.env.ELEVENLABS_VOICE_IDS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids?.length) {
      const r = await fetch(`${ELEVEN}/v1/voices`, { headers: this.headers() });
      if (!r.ok) throw new Error(`voices: ${await failText(r)}`);
      ids = (await r.json()).voices
        .filter((v) => v.category === "premade")
        .slice(0, 2)
        .map((v) => v.voice_id);
    }
    return { he: ids, en: ids };
  },
  // Model per language: ELEVENLABS_MODEL, else the first of these that lists the language.
  async model(lang) {
    if (process.env.ELEVENLABS_MODEL) return process.env.ELEVENLABS_MODEL;
    if (!elevenModels) {
      const r = await fetch(`${ELEVEN}/v1/models`, { headers: this.headers() });
      if (!r.ok) throw new Error(`models: ${await failText(r)}`);
      elevenModels = await r.json();
    }
    const supports = (id) =>
      elevenModels.find((m) => m.model_id === id)?.languages?.some((l) => l.language_id === lang);
    const model = ["eleven_v4", "eleven_multilingual_v2", "eleven_v3"].find(supports);
    if (!model) throw new Error(`no ElevenLabs model on this account lists language "${lang}"`);
    return model;
  },
  async synth(text, lang, voice) {
    const model = await this.model(lang);
    const r = await fetch(`${ELEVEN}/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: model }),
    });
    if (!r.ok) throw new Error(await failText(r));
    return { audio: Buffer.from(await r.arrayBuffer()), model };
  },
};

// ---------- run ----------

function duration(file) {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      encoding: "utf8",
    });
    return Math.round(Number(out) * 10) / 10;
  } catch {
    return null;
  }
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const safe = (s) => s.replace(/[^A-Za-z0-9_.-]+/g, "_");

async function main() {
  mkdirSync(OUT, { recursive: true });
  const texts = Object.fromEntries(
    Object.entries(SOURCES).map(([lang, file]) => [
      lang,
      firstParagraphs(readFileSync(join(ROOT, file), "utf8")).join("\n\n"),
    ]),
  );
  const clips = [];
  const skipped = [];

  for (const p of [openai, google, elevenlabs]) {
    if (!p.enabled()) {
      skipped.push(`${p.name}: ${p.missing}`);
      continue;
    }
    let voices;
    try {
      voices = await p.voices();
    } catch (err) {
      skipped.push(`${p.name}: ${err.message}`);
      continue;
    }
    for (const lang of ["he", "en"]) {
      for (const voice of voices[lang]) {
        const file = `${p.name}-${safe(voice)}-${lang}.mp3`;
        try {
          const { audio, model } = await p.synth(texts[lang], lang, voice);
          writeFileSync(join(OUT, file), audio);
          clips.push({ provider: p.name, voice, lang, model, file, seconds: duration(join(OUT, file)) });
          console.log(`  ✓ ${file} (${model})`);
        } catch (err) {
          clips.push({ provider: p.name, voice, lang, file: null, error: err.message });
          console.log(`  ✗ ${p.name} ${voice} ${lang}: ${err.message}`);
        }
      }
    }
  }

  // Characters across every post, for the cost table.
  const totals = { he: 0, en: 0, posts: 0 };
  for (const lang of ["he", "en"]) {
    for (const f of readdirSync(join(ROOT, "content/blog", lang)).filter((f) => f.endsWith(".md"))) {
      totals[lang] += spokenChars(readFileSync(join(ROOT, "content/blog", lang, f), "utf8"));
      totals.posts += 1;
    }
  }
  const all = totals.he + totals.en;
  const perPost = Math.round(all / totals.posts);
  const cost = PRICES.map((p) => ({ ...p, post: (perPost / 1000) * p.per1k, blog: (all / 1000) * p.per1k }));

  console.log(`\nSkipped:${skipped.length ? "" : " none"}`);
  for (const s of skipped) console.log(`  - ${s}`);
  console.log(
    `\nCharacters: he ${totals.he.toLocaleString()}, en ${totals.en.toLocaleString()}, total ${all.toLocaleString()} across ${totals.posts} posts (avg ${perPost.toLocaleString()} per post)`,
  );
  console.log("\nApprox. cost (USD), list price before free tiers:");
  for (const c of cost) {
    console.log(
      `  ${c.label.padEnd(34)} $${c.per1k.toFixed(3)}/1k chars  per post ~$${c.post.toFixed(2)}  whole blog ~$${c.blog.toFixed(2)}  (${c.note}) ${c.url}`,
    );
  }

  const section = (lang) => `
  <h2>${lang === "he" ? "עברית" : "English"}</h2>
  <p class="src" dir="${lang === "he" ? "rtl" : "ltr"}">${esc(texts[lang]).replace(/\n\n/g, "<br><br>")}</p>
  ${clips
    .filter((c) => c.lang === lang)
    .map(
      (c) => `
  <div class="clip">
    <div><b>${esc(c.provider)}</b> · ${esc(c.voice)}${c.model ? ` · ${esc(c.model)}` : ""}${c.seconds ? ` · ${c.seconds}s` : ""}</div>
    ${c.file ? `<audio controls preload="none" src="${esc(c.file)}"></audio>` : `<div class="err">${esc(c.error)}</div>`}
  </div>`,
    )
    .join("")}`;
  writeFileSync(
    join(OUT, "index.html"),
    `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kidsit blog voice comparison</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; max-width: 760px; margin: 24px auto; padding: 0 16px; color: #2b2118; background: #fbf7f1; }
  .src { background: #fff; border: 1px solid #e6dccf; border-radius: 10px; padding: 12px 14px; }
  .clip { margin: 14px 0; } audio { width: 100%; margin-top: 4px; }
  .err { color: #a33; font-size: 14px; } table { border-collapse: collapse; width: 100%; font-size: 14px; }
  td, th { border-bottom: 1px solid #e6dccf; padding: 6px 4px; text-align: left; }
</style></head><body>
  <h1>Kidsit blog: voice comparison</h1>
  <p>Listen for: Hebrew words misread without niqqud (names, “Kidsit”, numbers, times like 18:10), pacing, and whether quoted lines like «קשה לך שזה נגמר» sound like speech rather than a list.</p>
  ${skipped.length ? `<p class="err">Skipped: ${skipped.map(esc).join("; ")}</p>` : ""}
  ${section("he")}
  ${section("en")}
  <h2>Cost</h2>
  <p>${all.toLocaleString()} characters across ${totals.posts} posts (avg ${perPost.toLocaleString()} per post). List prices checked 2026-11-11, before free tiers.</p>
  <table><tr><th>Voice</th><th>$/1k chars</th><th>Per post</th><th>Whole blog</th><th>Note</th></tr>
  ${cost.map((c) => `<tr><td><a href="${c.url}">${esc(c.label)}</a></td><td>$${c.per1k.toFixed(3)}</td><td>$${c.post.toFixed(2)}</td><td>$${c.blog.toFixed(2)}</td><td>${esc(c.note)}</td></tr>`).join("")}
  </table>
</body></html>
`,
  );
  console.log(`\n${clips.filter((c) => c.file).length} clips. Open ${join(OUT, "index.html")}`);
}

// Importable for checks; runs only when executed directly.
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
