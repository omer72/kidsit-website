import { NextResponse, type NextRequest } from "next/server";

// "/", "/support" and "/accessibility": pick he/en from the switcher's cookie, else Accept-Language.
export function middleware(req: NextRequest) {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  const he = cookie
    ? cookie === "he"
    : /^\s*he\b/i.test(req.headers.get("accept-language") ?? "");
  const path = req.nextUrl.pathname === "/" ? "" : req.nextUrl.pathname;
  return NextResponse.redirect(new URL(`/${he ? "he" : "en"}${path}`, req.url), 307);
}

export const config = { matcher: ["/", "/support", "/accessibility"] };
