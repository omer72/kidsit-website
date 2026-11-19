import { NextResponse, type NextRequest } from "next/server";
import { campaignToken, playStoreHref, appStoreHref, BLOG_INDEX_PAGE, HOME_PAGE, type StoreLink } from "@/lib/store-links";

// Smart store link, the target of the desktop QR code (components/desktop-qr.tsx) and a Universal Link path:
// an iPhone goes to the App Store, an Android phone to Google Play, anything else to the site's home page.
// Both store links carry the same campaign tokens as every other store button (ct / Play referrer), with placement "qr".
// Query: l = he | en (default en), p = page token (a post slug, "home" or "blog-index"). Nothing else is read,
// and every destination is fixed, so this is not an open redirect. Nothing is stored.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IOS = /iPhone|iPad|iPod/i;
const ANDROID = /Android/i;

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const lang: "he" | "en" = q.get("l") === "he" ? "he" : "en";
  const page = campaignToken((q.get("p") ?? "").slice(0, 80) || HOME_PAGE, 80);
  const medium: StoreLink["medium"] = page === HOME_PAGE ? "home" : "blog";
  const link: StoreLink = { medium, lang, page: page === "site" ? HOME_PAGE : page, placement: "qr" };
  const ua = req.headers.get("user-agent") ?? "";

  let destination: string;
  if (IOS.test(ua)) destination = appStoreHref(link);
  else if (ANDROID.test(ua)) destination = playStoreHref(link);
  else destination = new URL(page === BLOG_INDEX_PAGE ? `/${lang}/blog` : `/${lang}`, req.url).toString();

  const res = NextResponse.redirect(destination, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Vary", "User-Agent");
  return res;
}
