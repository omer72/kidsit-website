import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET as appRoute } from "../app/app/route";
import { detectTouch } from "./attribution";
import { listPosts } from "./blog";
import {
  ANDROID_PACKAGE,
  androidIntentEligible,
  androidIntentHref,
  appOpenUrl,
  appStoreId,
  playStoreHref,
  storeHref,
  storeHrefFor,
  type StoreLink,
} from "./store-links";

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

const UA = {
  chrome: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.58 Mobile Safari/537.36",
  samsung: "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  edge: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.0.0",
  webview: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36",
  facebook: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0.0.0;]",
  instagram: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.0 Android",
  tiktok: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 musical_ly_2023 BytedanceWebview/d8a21c6",
  firefox: "Mozilla/5.0 (Android 14; Mobile; rv:132.0) Gecko/132.0 Firefox/132.0",
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1",
  desktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  desktopAndroidMode: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
};

const post: StoreLink = { medium: "blog", lang: "en", page: "toddler-wont-hug-relatives", placement: "inline" };
const hePost: StoreLink = { medium: "blog", lang: "he", page: "lo-rotze-leneshek-et-savta", placement: "bar" };
const touch = (qs: string, referrer = "") => detectTouch({ href: `https://kidsit.ai/en/blog/x${qs}`, referrer, siteHost: "kidsit.ai" });

test("intent links only for browsers that handle intent:// + browser_fallback_url", () => {
  for (const k of ["chrome", "samsung", "edge"] as const) assert.equal(androidIntentEligible(UA[k]), true, k);
  for (const k of ["webview", "facebook", "instagram", "tiktok", "firefox", "iphoneSafari", "iphoneChrome", "desktop", "desktopAndroidMode"] as const)
    assert.equal(androidIntentEligible(UA[k]), false, k);
  assert.equal(androidIntentEligible(""), false);
});

function parseIntent(href: string) {
  assert.ok(href.startsWith("intent://"), href);
  const [uri, frag] = href.slice("intent://".length).split("#Intent;");
  const fields = Object.fromEntries(frag.replace(/;end$/, "").split(";").map((f) => [f.slice(0, f.indexOf("=")), f.slice(f.indexOf("=") + 1)]));
  return { url: new URL(`https://${uri}`), fields };
}

test("Android intent href: app opens on kidsit.ai/app with page + attribution, fallback is the exact Play link", () => {
  const href = androidIntentHref(post);
  const { url, fields } = parseIntent(href);
  assert.equal(url.host, "kidsit.ai");
  assert.equal(url.pathname, "/app");
  assert.equal(fields.scheme, "https");
  assert.equal(fields.package, ANDROID_PACKAGE);
  assert.equal(ANDROID_PACKAGE, "ai.kidsit.app");
  assert.equal(decodeURIComponent(fields["S.browser_fallback_url"]), playStoreHref(post));
  assert.ok(href.endsWith(";end"));
  const q = url.searchParams;
  assert.equal(q.get("l"), "en");
  assert.equal(q.get("p"), "toddler-wont-hug-relatives");
  assert.equal(q.get("ct"), "toddler-wont-hug-relatives-inline");
  assert.deepEqual(
    [q.get("utm_source"), q.get("utm_medium"), q.get("utm_campaign"), q.get("utm_content")],
    ["kidsit.ai", "blog", "toddler-wont-hug-relatives", "inline"],
  );
  // The fallback keeps the Play referrer (install attribution).
  const fb = new URL(decodeURIComponent(fields["S.browser_fallback_url"]));
  assert.equal(fb.host, "play.google.com");
  assert.equal(new URLSearchParams(fb.searchParams.get("referrer")!).get("utm_content"), "inline");
  assert.equal(fb.searchParams.get("id"), "ai.kidsit.app");
});

test("HE post shares the English campaign token; the fallback can never break out of the intent (no raw ; or #)", () => {
  const { url, fields } = parseIntent(androidIntentHref(hePost));
  assert.equal(url.searchParams.get("l"), "he");
  assert.equal(url.searchParams.get("ct"), "toddler-wont-hug-relatives-bar");
  assert.equal(url.searchParams.get("utm_campaign"), "toddler-wont-hug-relatives");
  assert.ok(!/[;#]/.test(fields["S.browser_fallback_url"]));
});

test("a detected first touch (paid) flows into both the app URL and the Play fallback; gclid only in the fallback and only when allowed", () => {
  const t = touch("?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale&gclid=ABC123");
  const without = parseIntent(androidIntentHref(post, t));
  assert.equal(without.url.searchParams.get("ct"), "ad-google-spring_sale-en");
  assert.equal(without.url.searchParams.get("utm_source"), "google");
  assert.equal(without.url.searchParams.get("utm_medium"), "cpc");
  assert.equal(without.url.searchParams.get("utm_campaign"), "spring_sale");
  assert.ok(!without.url.search.includes("gclid"));
  assert.ok(!decodeURIComponent(without.fields["S.browser_fallback_url"]).includes("gclid"));
  const withId = parseIntent(androidIntentHref(post, t, { includeClickId: true }));
  assert.ok(decodeURIComponent(withId.fields["S.browser_fallback_url"]).includes("gclid"));
  assert.ok(!withId.url.search.includes("gclid"));
  assert.equal(appOpenUrl(post, t).startsWith("https://kidsit.ai/app?"), true);
});

test("storeHrefFor: only Play on eligible Android browsers changes; Apple and everything else is the plain store link", () => {
  assert.equal(storeHrefFor("apple", post, UA.chrome), storeHref("apple", post));
  assert.equal(storeHrefFor("apple", post, UA.iphoneChrome), storeHref("apple", post));
  assert.equal(storeHrefFor("play", post, UA.desktop), storeHref("play", post));
  assert.equal(storeHrefFor("play", post, UA.iphoneSafari), storeHref("play", post));
  assert.equal(storeHrefFor("play", post, UA.facebook), storeHref("play", post));
  assert.equal(storeHrefFor("play", post, UA.webview), storeHref("play", post));
  assert.equal(storeHrefFor("play", post, UA.firefox), storeHref("play", post));
  assert.equal(storeHrefFor("play", post, UA.chrome), androidIntentHref(post));
  assert.equal(storeHrefFor("play", post, UA.samsung), androidIntentHref(post));
});

test("server-rendered store links stay plain https store URLs (no intent:// in SSR/JSON-LD, desktop untouched)", () => {
  for (const f of ["src/components/store-badges.tsx", "src/components/android-install-banner.tsx", "src/lib/blog.ts"]) {
    assert.ok(!/intent:\/\//.test(read(f)), f);
  }
  assert.match(read("src/components/store-attribution.tsx"), /storeHrefFor\(parsed\.kind, parsed\.link, navigator\.userAgent/);
});

const get = (qs: string, ua: string) => appRoute(new NextRequest(`https://kidsit.ai/app${qs}`, { headers: { "user-agent": ua } }));
const loc = (r: Response) => new URL(r.headers.get("location")!);

test("/app: iPhone → App Store with ct/pt/mt, Android → Play with referrer, desktop → site (302, no-store, Vary UA)", () => {
  const ios = get("?l=he&p=toddler-wont-hug-relatives", UA.iphoneChrome);
  assert.equal(ios.status, 302);
  assert.equal(ios.headers.get("cache-control"), "no-store");
  assert.match(ios.headers.get("vary") ?? "", /User-Agent/i);
  const a = loc(ios);
  assert.equal(a.host, "apps.apple.com");
  assert.ok(a.pathname.endsWith("/id6769443099"));
  assert.equal(a.searchParams.get("ct"), "toddler-wont-hug-relatives-qr");
  assert.equal(a.searchParams.get("mt"), "8");
  assert.ok(a.searchParams.get("pt"));
  const and = loc(get("?l=he&p=toddler-wont-hug-relatives", UA.chrome));
  assert.equal(and.host, "play.google.com");
  assert.equal(and.searchParams.get("id"), "ai.kidsit.app");
  assert.equal(new URLSearchParams(and.searchParams.get("referrer")!).get("utm_content"), "qr");
  assert.equal(loc(get("?l=he", UA.desktop)).toString(), "https://kidsit.ai/he");
  assert.equal(loc(get("?l=en&p=blog-index", UA.desktop)).toString(), "https://kidsit.ai/en/blog");
  assert.equal(loc(get("", UA.desktop)).toString(), "https://kidsit.ai/en");
});

test("/app passes ct and utm_* through to the stores (cleaned), and cannot be used as an open redirect", () => {
  const ios = loc(get("?l=en&p=x&ct=ad-google-spring_sale-en&utm_source=google", UA.iphoneSafari));
  assert.equal(ios.searchParams.get("ct"), "ad-google-spring_sale-en");
  const droid = loc(get("?l=en&p=x&utm_source=google&utm_medium=cpc&utm_campaign=Spring%20Sale&utm_content=bar&ct=ignored", UA.chrome));
  const ref = new URLSearchParams(droid.searchParams.get("referrer")!);
  assert.deepEqual([ref.get("utm_source"), ref.get("utm_medium"), ref.get("utm_campaign"), ref.get("utm_content")], ["google", "cpc", "spring-sale", "bar"]);
  // ct is capped at the App Store limit and tokenised; junk and URLs cannot become a destination
  const long = loc(get(`?ct=${"a".repeat(80)}`, UA.iphoneSafari)).searchParams.get("ct")!;
  assert.equal(long.length, 40);
  for (const ua of [UA.iphoneSafari, UA.chrome, UA.desktop]) {
    const r = loc(get("?p=https://evil.example/x&l=https://evil.example&ct=https://evil.example&utm_source=//evil.example&next=https://evil.example", ua));
    assert.ok(["apps.apple.com", "play.google.com", "kidsit.ai"].includes(r.host), r.toString());
  }
  const evil = loc(get("?ct=https://evil.example/%0d%0aSet-Cookie:x", UA.iphoneSafari)).searchParams.get("ct")!;
  assert.match(evil, /^[a-z0-9._-]+$/);
});

test("association files match the app (kidsai-app 1.0.18): team + bundle id, package id, and the same three paths", () => {
  const aasa = JSON.parse(read("public/.well-known/apple-app-site-association"));
  const d = aasa.applinks.details[0];
  assert.deepEqual(d.appIDs, ["ZZT9HHZQNA.ai.kidsit.app"]);
  assert.deepEqual(d.components.map((c: { "/": string }) => c["/"]), ["/he/blog/*", "/en/blog/*", "/app"]);
  const links = JSON.parse(read("public/.well-known/assetlinks.json"));
  assert.equal(links[0].target.package_name, ANDROID_PACKAGE);
  assert.deepEqual(links[0].relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(links[0].target.sha256_cert_fingerprints.length, 2);
});

// ---------------------------------------------------------------------------------------------------------------
// iOS Smart App Banner: exactly one <meta name="apple-itunes-app"> per page, with the page's own canonical URL as
// app-argument on home / blog index / posts; the site's own install banner never shows on iOS.
// ---------------------------------------------------------------------------------------------------------------

test("smart app banner: the layout fallback and every banner page use the same app id; blog pages set their own tag", () => {
  const layout = read("src/app/[lang]/layout.tsx");
  assert.match(layout, /"apple-itunes-app": `app-id=\$\{appStoreId\(\)\}`/);
  assert.equal(appStoreId(), "6769443099");
  for (const f of ["src/app/[lang]/page.tsx", "src/app/[lang]/blog/page.tsx", "src/app/[lang]/blog/[slug]/page.tsx"]) {
    const src = read(f);
    assert.equal((src.match(/"apple-itunes-app"/g) ?? []).length, 1, f);
    assert.match(src, /smartBannerContent\(/, f);
  }
  // the tag is metadata only: no component renders a second one by hand
  for (const f of ["src/components/android-install-banner.tsx", "src/components/blog-install-bar.tsx", "src/components/store-badges.tsx", "src/components/desktop-qr.tsx"]) {
    assert.doesNotMatch(read(f), /apple-itunes-app/, f);
  }
});

test("smart app banner: built pages carry exactly one tag whose app-argument is the page's canonical URL (when a build exists)", (t) => {
  const dir = new URL("../../.next/server/app/", import.meta.url);
  const page = (rel: string) => {
    try {
      return readFileSync(new URL(rel, dir), "utf8");
    } catch {
      return null;
    }
  };
  const he = listPosts("he")[0];
  const en = listPosts("en")[0];
  const cases = [
    ["en.html", "https://kidsit.ai/en"],
    ["he.html", "https://kidsit.ai/he"],
    ["en/blog.html", "https://kidsit.ai/en/blog"],
    ["he/blog.html", "https://kidsit.ai/he/blog"],
    [`en/blog/${en.slug}.html`, `https://kidsit.ai${en.path}`],
    [`he/blog/${he.slug}.html`, `https://kidsit.ai${he.path}`],
  ] as const;
  const first = page(cases[0][0]);
  if (first === null) return t.skip("no .next build output");
  for (const [file, url] of cases) {
    const html = page(file);
    assert.ok(html, file);
    const tags = html!.match(/<meta name="apple-itunes-app"[^>]*>/g) ?? [];
    assert.equal(tags.length, 1, `${file}: ${tags.length} tags`);
    const content = /content="([^"]*)"/.exec(tags[0])![1].replace(/&amp;/g, "&");
    assert.match(content, new RegExp(`^app-id=6769443099, app-argument=${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}, affiliate-data=pt=\\d+&ct=[a-z0-9._-]+-banner$`), `${file}: ${content}`);
    const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html!)?.[1];
    assert.equal(canonical, url, `${file}: canonical`);
  }
  for (const file of ["en/privacy.html", "he/privacy.html", "en/about.html"]) {
    const html = page(file);
    if (!html) continue;
    assert.equal((html.match(/<meta name="apple-itunes-app"/g) ?? []).length, 1, file);
  }
});

test("site install banner is Android-only (iOS Safari gets Apple's Smart App Banner, never two top banners)", () => {
  const src = read("src/components/android-install-banner.tsx");
  assert.match(src, /setShow\(\/Android\/i\.test\(navigator\.userAgent\) && !closed\)/);
  assert.equal((src.match(/navigator\.userAgent/g) ?? []).length, 1); // the one Android test above is the only UA branch
  assert.equal(/Android/i.test(UA.iphoneSafari), false);
  assert.equal(/Android/i.test(UA.iphoneChrome), false);
  // it still renders nothing on the server, so a Smart-App-Banner page has no banner-shaped markup before hydration
  assert.match(src, /useState\(false\)/);
});
