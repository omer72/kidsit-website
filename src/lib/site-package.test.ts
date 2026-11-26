import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { splitAtCta, CTA_MARKER } from "../components/article-cta";
import { bannerLink } from "../components/android-install-banner";
import { APP_STORE_URL } from "../dictionaries";
import { qrSvg, qrTarget } from "./qr";
import { shouldBypassLocale } from "./locale-bypass";
import { appStoreId, smartBannerContent, type StoreLink } from "./store-links";

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("apple-app-site-association: valid JSON, real appID, only the blog and /app", () => {
  const aasa = JSON.parse(read("public/.well-known/apple-app-site-association"));
  const details = aasa.applinks.details;
  assert.equal(details.length, 1);
  assert.deepEqual(details[0].appIDs, ["ZZT9HHZQNA.ai.kidsit.app"]);
  assert.deepEqual(details[0].components.map((c: { "/": string }) => c["/"]), ["/he/blog/*", "/en/blog/*", "/app"]);
  assert.doesNotMatch(read("public/.well-known/apple-app-site-association"), /TEAMID|REPLACE|TODO/i);
});

test("assetlinks.json: package and both SHA-256 fingerprints (Play app signing + upload)", () => {
  const links = JSON.parse(read("public/.well-known/assetlinks.json"));
  assert.equal(links.length, 1);
  assert.deepEqual(links[0].relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(links[0].target.namespace, "android_app");
  assert.equal(links[0].target.package_name, "ai.kidsit.app");
  const fps: string[] = links[0].target.sha256_cert_fingerprints;
  assert.equal(fps.length, 2);
  for (const fp of fps) assert.match(fp, /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  assert.ok(fps.includes("7E:19:0C:5A:5B:E8:E2:D0:80:3D:AD:FD:50:DD:AF:6E:DE:53:31:7C:3A:70:E8:86:D5:95:27:9A:58:92:F9:C3"));
  assert.ok(fps.includes("53:E6:03:67:14:A6:4B:EC:B9:63:A0:DF:27:4B:0A:E1:66:4C:0C:1E:6B:58:EE:58:C2:49:0F:C3:1F:EF:AC:16"));
});

test("well-known files are served as JSON and never reach the locale middleware", () => {
  const cfg = read("next.config.mjs");
  assert.match(cfg, /source: "\/\.well-known\/apple-app-site-association"[\s\S]*?application\/json/);
  assert.match(cfg, /source: "\/\.well-known\/assetlinks\.json"[\s\S]*?application\/json/);
  const matcher = /^\/((?!_next\/|api\/|he\/|he$|en\/|en$|.*\.).*)$/;
  assert.equal(matcher.test("/.well-known/apple-app-site-association"), false);
  assert.equal(matcher.test("/.well-known/assetlinks.json"), false);
  // /app does enter the middleware, which lets it through to the route handler (shouldBypassLocale)
  assert.equal(matcher.test("/app"), true);
  assert.match(read("src/middleware.ts"), /if \(shouldBypassLocale\(pathname\)\) return NextResponse\.next\(\)/);
  assert.equal(shouldBypassLocale("/app"), true);
  assert.equal(shouldBypassLocale("/application"), false);
});

test("smart app banner: app-argument is the page URL, affiliate-data carries pt and the page ct", () => {
  const link: StoreLink = { medium: "blog", lang: "he", page: "hetkefei-zaam-gil-3", placement: "bar" };
  const meta = smartBannerContent(link, "https://kidsit.ai/he/blog/hetkefei-zaam-gil-3");
  assert.equal(
    meta,
    `app-id=${appStoreId()}, app-argument=https://kidsit.ai/he/blog/hetkefei-zaam-gil-3, affiliate-data=pt=128661105&ct=he-hetkefei-zaam-gil-3-banner`,
  );
  assert.match(APP_STORE_URL, new RegExp(`id${appStoreId()}`));
  // long slugs keep the ≤ 40 char ct rule
  const long = smartBannerContent({ ...link, page: "a-very-long-blog-post-slug-that-goes-on-and-on-forever" }, "https://kidsit.ai/he/blog/x");
  const ct = new URLSearchParams(long.split("affiliate-data=")[1]).get("ct")!;
  assert.ok(ct.length <= 40 && ct.endsWith("-banner") && ct.startsWith("he-"), ct);
  // not an https URL → no app-argument
  assert.doesNotMatch(smartBannerContent(link, "javascript:alert(1)"), /app-argument/);
});

test("android banner link: home, blog index and posts only, with the page's own token", () => {
  assert.deepEqual(bannerLink("/he", "he"), { medium: "home", lang: "he", page: "home", placement: "banner" });
  assert.equal(bannerLink("/en/blog", "en")?.page, "blog-index");
  assert.equal(bannerLink("/en/blog/screen-time-meltdown", "en")?.page, "screen-time-meltdown");
  assert.equal(bannerLink("/en/privacy", "en"), null);
  assert.equal(bannerLink("/he/about", "he"), null);
});

test("CTA marker: split once, comment only (never spoken), present in the planned posts", () => {
  assert.deepEqual(splitAtCta("<p>a</p>\n<!-- cta -->\n<h2>b</h2>"), ["<p>a</p>\n", "\n<h2>b</h2>"]);
  assert.deepEqual(splitAtCta("<p>a</p>"), ["<p>a</p>", null]);
  let withMarker = 0;
  for (const lang of ["he", "en"]) {
    for (const f of readdirSync(new URL(`../../content/blog/${lang}`, import.meta.url)).filter((x) => x.endsWith(".md"))) {
      const md = read(`content/blog/${lang}/${f}`);
      const n = md.split(CTA_MARKER).length - 1;
      assert.ok(n <= 1, `${lang}/${f} has ${n} markers`);
      withMarker += n;
    }
  }
  assert.equal(withMarker, 14);
});

test("QR: scannable SVG for the smart store link, labelled, nothing external", () => {
  assert.equal(qrTarget("he", "hetkefei-zaam-gil-3"), "https://kidsit.ai/app?l=he&p=hetkefei-zaam-gil-3");
  const svg = qrSvg(qrTarget("en", "x"), 'QR "label"');
  assert.match(svg, /^<svg /);
  assert.match(svg, /role="img" aria-label="QR &quot;label&quot;"/);
  assert.doesNotMatch(svg, /<script|href=/i);
});

test("English articles never link to a Hebrew article without hreflang", () => {
  for (const f of readdirSync(new URL("../../content/blog/en", import.meta.url)).filter((x) => x.endsWith(".md"))) {
    const md = read(`content/blog/en/${f}`);
    assert.doesNotMatch(md, /\]\(\/he\//, `${f}: plain markdown link to /he/`);
    for (const m of md.matchAll(/<a [^>]*href="\/he\/[^"]*"[^>]*>/g)) assert.match(m[0], /hreflang="he"/, `${f}: ${m[0]}`);
  }
});

test("prices: Hebrew shows Play Israel prices labelled Google Play, never USD or an App Store ILS claim", () => {
  const pricing = read("src/components/pricing.tsx");
  assert.match(pricing, /he: \{ monthly: "₪29\.90", yearly: "₪175" \}/);
  const dict = read("src/dictionaries.ts");
  const he = dict.slice(dict.indexOf("yearlyNote: \"חיוב שנתי"), dict.indexOf("yearlyNote: \"חיוב שנתי") + 600);
  assert.match(he, /Google Play בישראל; ב-App Store המחיר המעודכן מוצג בחנות/);
  assert.doesNotMatch(dict, /זה \$5\.00 לחודש/);
  assert.match(dict, /perYear: "לשנה ב-Google Play"/);
});

test("/app smart link: iPhone → App Store, Android → Google Play, desktop → site; QR placement on both", async () => {
  const { NextRequest } = await import("next/server");
  const { GET } = await import("../app/app/route");
  const hit = (ua: string, qs = "?l=he&p=hetkefei-zaam-gil-3") =>
    GET(new NextRequest(`https://kidsit.ai/app${qs}`, { headers: { "user-agent": ua } }));
  const ios = hit("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15");
  assert.equal(ios.status, 302);
  const iosUrl = new URL(ios.headers.get("location")!);
  assert.equal(iosUrl.hostname, "apps.apple.com");
  assert.equal(iosUrl.searchParams.get("pt"), "128661105");
  assert.equal(iosUrl.searchParams.get("ct"), "he-hetkefei-zaam-gil-3-qr");
  const and = new URL(hit("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile").headers.get("location")!);
  assert.equal(and.hostname, "play.google.com");
  assert.equal(and.searchParams.get("id"), "ai.kidsit.app");
  const referrer = new URLSearchParams(and.searchParams.get("referrer")!);
  assert.equal(referrer.get("utm_content"), "qr");
  assert.equal(referrer.get("utm_campaign"), "he-hetkefei-zaam-gil-3");
  const desk = hit("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120");
  assert.equal(desk.headers.get("location"), "https://kidsit.ai/he");
  assert.equal(desk.headers.get("cache-control"), "no-store");
  // junk input can never choose the destination
  const evil = hit("Mozilla/5.0 (Macintosh)", "?l=//evil.example&p=https://evil.example");
  assert.equal(new URL(evil.headers.get("location")!).hostname, "kidsit.ai");
});
