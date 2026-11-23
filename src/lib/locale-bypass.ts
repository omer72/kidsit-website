// API routes must not be rewritten onto /he or /en. The middleware matcher
// repeats this exclusion as a static string (Next.js analyzes it at build time).
// /admin (private stats, own root layouts: Hebrew at /admin/stats, English at /admin/stats/en) is not locale-routed.
// /app is the smart store link (route handler, redirects by device) used by the desktop QR code.
// /marketing is an unlisted, noindex landing page test (own root layout, English only).
export function shouldBypassLocale(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/app" ||
    pathname === "/marketing" ||
    pathname.startsWith("/marketing/")
  );
}
