// Capacitor's WebView origin is capacitor://localhost on iOS and https://localhost
// on Android. http://localhost (with or without a port) covers local builds.
const EXACT_ORIGINS = new Set(["capacitor://localhost", "https://localhost", "http://localhost"]);

export function isAllowedInsightOrigin(origin: string): boolean {
  if (EXACT_ORIGINS.has(origin)) return true;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  if (url.protocol === "capacitor:" && url.hostname === "localhost") return true;
  if ((url.protocol === "https:" || url.protocol === "http:") && url.hostname === "localhost") return true;
  return false;
}

export function insightCorsHeaders(origin: string | null): Headers {
  const headers = new Headers();
  headers.set("Vary", "Origin");
  headers.set("Cache-Control", "no-store");
  if (origin && isAllowedInsightOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}
