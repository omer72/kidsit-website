import { createHash, createPrivateKey, createSign, type KeyObject } from "node:crypto";

// Service-account auth for Google APIs without the googleapis package: an RS256-signed JWT exchanged for an
// access token (https://developers.google.com/identity/protocols/oauth2/service-account#httprest). Server-only.

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const SCOPE_GSC = "https://www.googleapis.com/auth/webmasters.readonly";
export const SCOPE_GA4 = "https://www.googleapis.com/auth/analytics.readonly";

export type ServiceAccount = { clientEmail: string; key: KeyObject; fingerprint: string };
export type Parsed = { ok: true; sa: ServiceAccount } | { ok: false; error: string };
type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

/** Validates GOOGLE_SERVICE_ACCOUNT_JSON. Error texts never include the key or any other field value. */
export function parseServiceAccount(raw: string | undefined): Parsed {
  if (!raw || !raw.trim()) return { ok: false, error: "GOOGLE_SERVICE_ACCOUNT_JSON חסר." };
  let j: unknown;
  try {
    j = JSON.parse(raw);
  } catch {
    return { ok: false, error: "GOOGLE_SERVICE_ACCOUNT_JSON אינו JSON תקין. הדביקו את כל קובץ המפתח כמו שהוא." };
  }
  if (typeof j !== "object" || j === null) return { ok: false, error: "GOOGLE_SERVICE_ACCOUNT_JSON אינו אובייקט JSON." };
  const o = j as Record<string, unknown>;
  if (o.type !== undefined && o.type !== "service_account")
    return { ok: false, error: "GOOGLE_SERVICE_ACCOUNT_JSON אינו מפתח של חשבון שירות (type ≠ service_account)." };
  const email = typeof o.client_email === "string" ? o.client_email.trim() : "";
  if (!/^[^@\s]{1,200}@[a-z0-9.-]{1,200}\.iam\.gserviceaccount\.com$/i.test(email))
    return { ok: false, error: "חסר client_email תקין של חשבון שירות ב-GOOGLE_SERVICE_ACCOUNT_JSON." };
  // Some env editors keep "\n" as two characters; turn them back into newlines.
  const pem = typeof o.private_key === "string" ? o.private_key.replace(/\\n/g, "\n") : "";
  if (!pem.includes("-----BEGIN PRIVATE KEY-----")) return { ok: false, error: "חסר private_key ב-GOOGLE_SERVICE_ACCOUNT_JSON." };
  let key: KeyObject;
  try {
    key = createPrivateKey(pem);
  } catch {
    return { ok: false, error: "ה-private_key ב-GOOGLE_SERVICE_ACCOUNT_JSON לא נקרא כמפתח תקין." };
  }
  if (key.asymmetricKeyType !== "rsa") return { ok: false, error: "ה-private_key אינו מפתח RSA." };
  const fingerprint = createHash("sha256").update(email).update("\0").update(pem).digest("hex").slice(0, 12);
  return { ok: true, sa: { clientEmail: email, key, fingerprint } };
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function signJwt(sa: ServiceAccount, scope: string, nowS: number): string {
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.clientEmail, scope, aud: GOOGLE_TOKEN_URL, iat: nowS, exp: nowS + 3600 }));
  const sig = createSign("RSA-SHA256").update(`${head}.${claims}`).sign(sa.key);
  return `${head}.${claims}.${b64url(sig)}`;
}

export class GoogleApiError extends Error {}
/** Bad or incomplete configuration; the message is safe to show. */
export class ConfigError extends Error {}

// Access tokens are reused in memory until 2 minutes before they expire.
const tokenCache = new Map<string, { token: string; exp: number }>();
export const clearTokenCache = () => tokenCache.clear();

export async function getAccessToken(sa: ServiceAccount, scope: string, fetchImpl: Fetch = fetch, nowMs = Date.now()): Promise<string> {
  const cacheKey = `${sa.fingerprint}|${scope}`;
  const hit = tokenCache.get(cacheKey);
  if (hit && hit.exp > nowMs + 120_000) return hit.token;
  let res: Response;
  try {
    res = await fetchImpl(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signJwt(sa, scope, Math.floor(nowMs / 1000)),
      }).toString(),
      cache: "no-store",
    });
  } catch {
    throw new GoogleApiError("החיבור לשרת ההרשאות של Google נכשל.");
  }
  const body = (await res.json().catch(() => null)) as { access_token?: unknown; expires_in?: unknown; error?: unknown } | null;
  if (!res.ok || !body || typeof body.access_token !== "string") {
    const code = typeof body?.error === "string" ? body.error.replace(/[^a-z_]/gi, "").slice(0, 40) : "";
    throw new GoogleApiError(`Google דחה את מפתח חשבון השירות (HTTP ${res.status}${code ? `, ${code}` : ""}).`);
  }
  const ttl = typeof body.expires_in === "number" ? body.expires_in : 3600;
  tokenCache.set(cacheKey, { token: body.access_token, exp: nowMs + ttl * 1000 });
  return body.access_token;
}

export function describeGoogleHttpError(api: string, status: number, sa: ServiceAccount): string {
  if (status === 401) return `${api}: הטוקן נדחה (401).`;
  if (status === 403)
    return `${api}: אין הרשאה (403). ודאו שה-API מופעל בפרויקט ושהחשבון ${sa.clientEmail} נוסף כמשתמש בנכס.`;
  if (status === 404) return `${api}: הנכס לא נמצא (404). בדקו את מזהה הנכס / כתובת האתר.`;
  if (status === 429) return `${api}: חריגה ממכסת הקריאות (429). נסו שוב מאוחר יותר.`;
  return `${api}: שגיאה (HTTP ${status}).`;
}

/** POST JSON to a Google API with a bearer token; throws GoogleApiError with a safe message. */
export async function googlePost(api: string, url: string, body: unknown, sa: ServiceAccount, scope: string, fetchImpl: Fetch = fetch): Promise<unknown> {
  const token = await getAccessToken(sa, scope, fetchImpl);
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new GoogleApiError(`${api}: החיבור נכשל.`);
  }
  if (!res.ok) throw new GoogleApiError(describeGoogleHttpError(api, res.status, sa));
  try {
    return await res.json();
  } catch {
    throw new GoogleApiError(`${api}: תשובה בפורמט לא צפוי.`);
  }
}
