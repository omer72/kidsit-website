// API routes must not be rewritten onto /he or /en. The middleware matcher
// repeats this exclusion as a static string (Next.js analyzes it at build time).
export function shouldBypassLocale(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}
