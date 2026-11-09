import { createHmac, timingSafeEqual } from "node:crypto";
import { configuredSecret, SESSION_COOKIE, verifySessionToken } from "./auth";

// Who may download /admin/stats/gsc-weekly.csv: a logged-in stats session (cookie), or, for automation,
// `Authorization: Bearer <STATS_EXPORT_TOKEN>` when that env var is set (at least 32 characters).
export const MIN_EXPORT_TOKEN = 32;
const COMPARE_KEY = "kidsit-admin-export:compare";
const mac = (s: string) => createHmac("sha256", COMPARE_KEY).update(s, "utf8").digest();

export function exportTokenOk(header: string | null, configured: string | undefined): boolean {
  const token = configured?.trim() ?? "";
  if (token.length < MIN_EXPORT_TOKEN || !header) return false;
  const m = /^Bearer\s+(\S{1,512})$/i.exec(header.trim());
  if (!m) return false;
  return timingSafeEqual(mac(m[1]), mac(token));
}

export function exportAllowed(
  req: { cookie: (name: string) => string | undefined; header: (name: string) => string | null },
  env: Record<string, string | undefined>,
  nowS?: number,
): boolean {
  if (verifySessionToken(req.cookie(SESSION_COOKIE), configuredSecret(env.STATS_PASSWORD), nowS)) return true;
  return exportTokenOk(req.header("authorization"), env.STATS_EXPORT_TOKEN);
}
