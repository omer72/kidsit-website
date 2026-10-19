import { NextResponse, type NextRequest } from "next/server";

// Full Accept-Language parsing with q-values; "iw" is the legacy code for Hebrew.
function prefersHebrew(header: string | null): boolean {
  let best: { lang: "he" | "en"; q: number } | null = null;
  for (const part of (header ?? "").split(",")) {
    const [tag, ...params] = part.trim().toLowerCase().split(";");
    const base = tag.split("-")[0];
    const lang = base === "he" || base === "iw" ? "he" : base === "en" ? "en" : null;
    if (!lang) continue;
    const qp = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const q = qp ? Number(qp.slice(2)) : 1;
    if (!(q > 0)) continue;
    if (!best || q > best.q) best = { lang, q };
  }
  return best?.lang === "he";
}

// Pages that exist under both /he and /en; their bare form redirects to the visitor's language.
const LOCALIZED = new Set(["/", "/privacy", "/terms", "/support", "/accessibility"]);

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  const he = cookie === "he" || cookie === "en" ? cookie === "he" : prefersHebrew(req.headers.get("accept-language"));
  const { pathname } = req.nextUrl;
  const path = pathname === "/" ? "" : pathname;
  const url = new URL(`/${he ? "he" : "en"}${path}`, req.url);
  url.search = req.nextUrl.search;
  if (LOCALIZED.has(pathname)) return NextResponse.redirect(url, 307);
  // Anything else without a /he or /en prefix doesn't exist: render the localized 404 (status 404, URL unchanged)
  // inside the visitor's language layout instead of Next's bare default page.
  return NextResponse.rewrite(url);
}

// Every path except /he/..., /en/..., Next internals and files (anything with an extension).
export const config = { matcher: ["/", "/((?!_next/|he/|he$|en/|en$|.*\\.).*)"] };
