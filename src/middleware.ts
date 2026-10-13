import { NextResponse, type NextRequest } from "next/server";

// "/" only: pick he/en from the switcher's cookie, else Accept-Language.
export function middleware(req: NextRequest) {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  const he = cookie
    ? cookie === "he"
    : /^\s*he\b/i.test(req.headers.get("accept-language") ?? "");
  return NextResponse.redirect(new URL(he ? "/he" : "/en", req.url), 307);
}

export const config = { matcher: "/" };
