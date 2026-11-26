import { createHash } from "node:crypto";

/** Best-effort, in-process cap. On Vercel each instance has its own map, so a firewall rule can still help. */
export const COMMENT_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 } as const;

export type RateBucketStore = Map<string, number[]>;

const buckets: RateBucketStore = new Map();

export function clientIpFromHeaders(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip")?.trim();
  return real || null;
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

/** Returns true if this key is still under the cap and records the attempt. */
export function allowRequest(
  key: string,
  now = Date.now(),
  windowMs = COMMENT_RATE_LIMIT.windowMs,
  max = COMMENT_RATE_LIMIT.max,
  store: RateBucketStore = buckets,
): boolean {
  const cutoff = now - windowMs;
  const prev = (store.get(key) ?? []).filter((t) => t > cutoff);
  if (prev.length >= max) {
    store.set(key, prev);
    return false;
  }
  prev.push(now);
  store.set(key, prev);
  return true;
}

export function consumeCommentSlot(ip: string | null, now = Date.now(), store: RateBucketStore = buckets): boolean {
  const key = ip ? hashIp(ip) : "unknown";
  return allowRequest(key, now, COMMENT_RATE_LIMIT.windowMs, COMMENT_RATE_LIMIT.max, store);
}
