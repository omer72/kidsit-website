import { createHmac, timingSafeEqual } from "node:crypto";

// Password gate for /admin/stats. The cookie never holds the password: it holds an expiry and an
// HMAC of that expiry keyed by STATS_PASSWORD, so changing the password signs everyone out.
export const SESSION_COOKIE = "kidsit_stats";
export const SESSION_TTL_S = 12 * 60 * 60;
const SESSION_CONTEXT = "kidsit-admin-stats:v1:";
// Fixed key used only to bring both passwords to the same length before the constant-time compare.
const COMPARE_KEY = "kidsit-admin-stats:compare";

const hmac = (key: string, msg: string) => createHmac("sha256", key).update(msg, "utf8").digest();

function sameBytes(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Unset or blank STATS_PASSWORD means the page is closed to everyone. */
export function configuredSecret(raw: string | undefined): string | null {
  return raw && raw.trim().length > 0 ? raw : null;
}

export function verifyPassword(input: unknown, secret: string | null): boolean {
  if (!secret || typeof input !== "string" || input.length === 0 || input.length > 512) return false;
  return sameBytes(hmac(COMPARE_KEY, input), hmac(COMPARE_KEY, secret));
}

export function createSessionToken(secret: string, nowS: number = Math.floor(Date.now() / 1000)): string {
  const exp = nowS + SESSION_TTL_S;
  return `${exp}.${hmac(secret, SESSION_CONTEXT + exp).toString("hex")}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string | null,
  nowS: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!secret || !token) return false;
  const m = /^(\d{1,12})\.([0-9a-f]{64})$/.exec(token);
  if (!m) return false;
  const exp = Number(m[1]);
  // Expired, or further out than any token this code issues (clock skew allowance: 60 s).
  if (exp <= nowS || exp > nowS + SESSION_TTL_S + 60) return false;
  return sameBytes(Buffer.from(m[2], "hex"), hmac(secret, SESSION_CONTEXT + exp));
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/admin",
  maxAge: SESSION_TTL_S,
};
