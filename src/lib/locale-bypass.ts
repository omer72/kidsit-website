// API routes must not be rewritten onto /he or /en. The middleware matcher
// repeats this exclusion as a static string (Next.js analyzes it at build time).
// /admin (private stats, own root layouts: Hebrew at /admin/stats, English at /admin/stats/en) is not locale-routed.
// /app is the smart store link (route handler, redirects by device) used by the desktop QR code.
export function shouldBypassLocale(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/app"
  );
}
