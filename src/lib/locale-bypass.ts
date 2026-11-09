// API routes must not be rewritten onto /he or /en. The middleware matcher
// repeats this exclusion as a static string (Next.js analyzes it at build time).
// /admin (private stats, own root layout) is Hebrew-only and is not localized either.
export function shouldBypassLocale(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/") || pathname === "/admin" || pathname.startsWith("/admin/");
}
