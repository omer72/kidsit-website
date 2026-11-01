import { timingSafeEqual } from "node:crypto";

export function bearerMatches(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length);
  const got = Buffer.from(token);
  const expected = Buffer.from(secret);
  if (got.length !== expected.length || got.length === 0) return false;
  return timingSafeEqual(got, expected);
}
