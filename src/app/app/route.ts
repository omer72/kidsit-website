import { NextResponse, type NextRequest } from "next/server";
import { MAX_VALUE, token } from "@/lib/attribution";
import { campaignToken, cleanCampaignParam, playStoreHref, appStoreHref, BLOG_INDEX_PAGE, HOME_PAGE, type StoreLink } from "@/lib/store-links";

// Smart store link, the target of the desktop QR code (components/desktop-qr.tsx) and a Universal Link path:
// an iPhone goes to the App Store, an Android phone to Google Play, anything else to the site's home page.
// Both store links carry the same campaign tokens as every other store button (ct / Play referrer), with placement "qr".
// Query: l = he | en (default en), p = page token (a post slug, "home" or "blog-index"). Optional attribution that a
// link on another site or the app-open intent carries: ct (App Store campaign token, ≤ 40) and utm_source / utm_medium /
// utm_campaign / utm_content (Play referrer); each is cut to [a-z0-9._-] and replaces the default value. Nothing else is
// read, and every destination is fixed, so this is not an open redirect. Nothing is stored.
// On iOS this is also a Universal Link (AASA path /app): from another site or the camera with the app installed, iOS opens
// the app and this handler never runs; a same-site tap or no app lands here and goes to the store.
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
  if (IOS.test(ua)) {
    const u = new URL(appStoreHref(link));
    const ct = cleanCampaignParam(q.get("ct"));
    if (ct) u.searchParams.set("ct", ct);
    destination = u.toString();
  } else if (ANDROID.test(ua)) {
    const u = new URL(playStoreHref(link));
    const ref = new URLSearchParams(u.searchParams.get("referrer") ?? "");
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const v = token(q.get(k) ?? "", MAX_VALUE);
      if (v) ref.set(k, v);
    }
    u.searchParams.set("referrer", ref.toString());
    destination = u.toString();
  } else destination = new URL(page === BLOG_INDEX_PAGE ? `/${lang}/blog` : `/${lang}`, req.url).toString();

  const res = NextResponse.redirect(destination, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Vary", "User-Agent");
  return res;
}
