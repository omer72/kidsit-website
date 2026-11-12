// TTS provider calls shared by scripts/tts-compare.mjs and scripts/generate-blog-audio.mjs.
// Keys come from env only; nothing here logs or returns them.

import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

export async function failText(r) {
  const t = await r.text().catch(() => "");
  return `HTTP ${r.status}: ${t.slice(0, 300)}`;
}

/** Why a provider cannot run, or null when its key is present. */
export function missingKey(provider) {
  if (provider === "elevenlabs") return process.env.ELEVENLABS_API_KEY ? null : "ELEVENLABS_API_KEY not set";
  if (provider === "google") {
    return process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? null
      : "GOOGLE_TTS_API_KEY and GOOGLE_APPLICATION_CREDENTIALS not set";
  }
  return `unknown provider "${provider}"`;
}

let googleToken = null;

/** GOOGLE_TTS_API_KEY, else a service-account JSON → signed JWT → OAuth access token (no SDK). */
export async function googleAuth() {
  if (process.env.GOOGLE_TTS_API_KEY) {
    return { query: `?key=${encodeURIComponent(process.env.GOOGLE_TTS_API_KEY)}`, headers: {} };
  }
  if (!googleToken) {
    const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
    const tokenUri = sa.token_uri || "https://oauth2.googleapis.com/token";
    const now = Math.floor(Date.now() / 1000);
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    })}`;
    const sig = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key).toString("base64url");
    const r = await fetch(tokenUri, {
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

/** One request → MP3 bytes. `voice` is a language entry from content/blog/tts-voices.json. */
export async function synthesize(text, voice) {
  const settings = voice.settings || {};
  if (voice.provider === "elevenlabs") {
    const { output_format = "mp3_44100_128", ...body } = settings;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voice}?output_format=${output_format}`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, text, model_id: voice.model }),
    });
    if (!r.ok) throw new Error(await failText(r));
    return Buffer.from(await r.arrayBuffer());
  }
  if (voice.provider === "google") {
    const auth = await googleAuth();
    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize${auth.query}`, {
      method: "POST",
      headers: { ...auth.headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.languageCode, name: voice.voice },
        audioConfig: { audioEncoding: "MP3", ...settings },
      }),
    });
    if (!r.ok) throw new Error(await failText(r));
    return Buffer.from((await r.json()).audioContent, "base64");
  }
  throw new Error(`unknown provider "${voice.provider}"`);
}
