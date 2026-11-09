import assert from "node:assert/strict";
import test from "node:test";
import { APP_STORE_PROVIDER_TOKEN, APP_STORE_URL, PLAY_STORE_URL } from "../dictionaries";
import { detectTouch } from "./attribution";
import {
  APP_STORE_CT_MAX,
  BLOG_INDEX_PAGE,
  HOME_PAGE,
  appStoreHref,
  campaignToken,
  ctFor,
  defaultCt,
  playReferrer,
  playStoreHref,
  resolveProviderToken,
  storeHref,
  storeLinkData,
  storeLinkFromData,
  type StoreLink,
} from "./store-links";

const post: StoreLink = { medium: "blog", lang: "en", page: "kidsit-vs-chatgpt", placement: "article" };
const bar: StoreLink = { ...post, placement: "bar" };
const hero: StoreLink = { medium: "home", lang: "he", page: HOME_PAGE, placement: "hero" };
const pricing: StoreLink = { ...hero, placement: "pricing_premium" };
const index: StoreLink = { medium: "blog", lang: "he", page: BLOG_INDEX_PAGE, placement: "bar" };
const ref = (href: string) => new URLSearchParams(new URL(href).searchParams.get("referrer")!);
const touch = (qs: string, referrer = "") => detectTouch({ href: `https://kidsit.ai/en/blog/x${qs}`, referrer, siteHost: "kidsit.ai" });

test("default ct carries lang, page and placement (server-rendered links)", () => {
  assert.equal(defaultCt(hero), "he-home-hero");
  assert.equal(defaultCt(pricing), "he-home-pricing");
  assert.equal(defaultCt({ ...hero, placement: "pricing_free" }), "he-home-pricing");
  assert.equal(defaultCt(index), "he-blog-index-bar");
  assert.equal(defaultCt(post), "en-kidsit-vs-chatgpt");
  assert.equal(defaultCt(bar), "en-kidsit-vs-chatgpt-bar");
});

test("App Store default link: fixed pt, ct, mt=8 in App Store Connect order", () => {
  assert.equal(APP_STORE_PROVIDER_TOKEN, "128661105");
  assert.equal(storeHref("apple", hero), `${APP_STORE_URL}?pt=128661105&ct=he-home-hero&mt=8`);
  assert.equal(storeHref("apple", bar), `${APP_STORE_URL}?pt=128661105&ct=en-kidsit-vs-chatgpt-bar&mt=8`);
  const refLink = new URL("https://apps.apple.com/app/apple-store/id6769443099?pt=128661105&ct=en-blog&mt=8");
  const ours = appStoreHref({ ...post, page: "blog" }, null, "128661105", refLink.origin + refLink.pathname);
  assert.equal(ours, refLink.toString());
});

test("App Store: pt left out when empty; existing pt/ct/mt not duplicated", () => {
  assert.equal(appStoreHref(post, null, ""), `${APP_STORE_URL}?ct=en-kidsit-vs-chatgpt&mt=8`);
  assert.equal(new URL(appStoreHref(hero, null, "1", appStoreHref(post))).search, "?pt=1&ct=he-home-hero&mt=8");
});

test("Play default link: id= kept, referrer encoded once with lang-page campaign and placement content", () => {
  assert.equal(
    storeHref("play", hero),
    "https://play.google.com/store/apps/details?id=ai.kidsit.app&referrer=utm_source%3Dkidsit.ai%26utm_medium%3Dhome%26utm_campaign%3Dhe-home%26utm_content%3Dhero",
  );
  assert.equal(
    playReferrer(post),
    "utm_source=kidsit.ai&utm_medium=blog&utm_campaign=en-kidsit-vs-chatgpt&utm_content=article",
  );
  assert.equal(ref(storeHref("play", pricing)).get("utm_content"), "pricing_premium");
  const withHl = new URL(playStoreHref(post, null, {}, "https://play.google.com/store/apps/details?id=ai.kidsit.app&hl=he"));
  assert.equal(withHl.searchParams.get("hl"), "he");
  assert.equal(withHl.searchParams.getAll("referrer").length, 1);
  assert.equal(new URL(playStoreHref(post, null, {}, "https://play.google.com/store/apps/details")).search.startsWith("?referrer="), true);
});

test("ct is ≤ 40 chars: page cut first, lang and placement kept, no trailing separator", () => {
  const long: StoreLink = { medium: "blog", lang: "he", page: "a-very-long-blog-post-slug-that-goes-on-and-on-forever", placement: "bar" };
  const c = defaultCt(long);
  assert.ok(c.length <= APP_STORE_CT_MAX);
  assert.equal(c, "he-a-very-long-blog-post-slug-that-g-bar");
  assert.ok(c.startsWith("he-") && c.endsWith("-bar"));
  const c2 = ctFor(long, touch("?utm_source=chatgpt.com"));
  assert.ok(c2.length <= 40 && c2.startsWith("ai-chatgpt-he-") && c2.endsWith("-bar") && !/[-._]-?bar$/.test(c2.replace(/-bar$/, "")), c2);
  for (let n = 1; n < 80; n++) {
    const l = { ...long, page: "x".repeat(n) + "-y" };
    for (const t of [null, touch("?utm_source=perplexity"), touch("?utm_source=google&utm_medium=cpc&utm_campaign=" + "c".repeat(n))]) {
      const v = ctFor(l, t);
      assert.ok(v.length <= 40, `${v} (${v.length})`);
      assert.ok(!/[-._]$/.test(v), v);
    }
  }
});

test("organic sources prefix ct and replace utm_source in the Play referrer", () => {
  const gpt = touch("?utm_source=chatgpt.com");
  assert.equal(ctFor(post, gpt), "ai-chatgpt-en-kidsit-vs-chatgpt");
  assert.equal(playReferrer(post, gpt), "utm_source=ai-chatgpt&utm_medium=blog&utm_campaign=en-kidsit-vs-chatgpt&utm_content=article");
  const ppx = touch("", "https://www.perplexity.ai/search?q=kidsit");
  assert.equal(ctFor(hero, ppx), "ai-perplexity-he-home-hero");
  const google = touch("", "https://www.google.co.il/");
  assert.equal(ctFor(bar, google), "google-en-kidsit-vs-chatgpt-bar");
  // direct = server-rendered link, unchanged
  const direct = touch("", "https://kidsit.ai/he");
  assert.equal(storeHref("apple", post, direct), storeHref("apple", post));
  assert.equal(storeHref("play", post, direct), storeHref("play", post));
});

test("paid: ct = ad-<source>-<campaign>[-<lang>], Play gets the full utm set, gclid only when allowed", () => {
  const g = touch("?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale&utm_content=video1&gclid=Cj0KCQabc");
  assert.equal(g.paid, true);
  assert.equal(ctFor(hero, g), "ad-google-spring_sale-he");
  assert.equal(
    playReferrer(hero, g),
    "utm_source=google&utm_medium=cpc&utm_campaign=spring_sale&utm_content=video1",
  );
  assert.equal(ref(playStoreHref(hero, g, { includeClickId: true })).get("gclid"), "Cj0KCQabc");
  assert.equal(ref(playStoreHref(hero, g)).get("gclid"), null);
  // click id only: paid, source from the click id, campaign falls back to lang-page, content to placement
  const fb = touch("?fbclid=IwAR123");
  assert.equal(fb.source, "facebook");
  assert.equal(fb.paid, true);
  assert.equal(ctFor(post, fb), "ad-facebook-en-kidsit-vs-chatgpt");
  assert.equal(playReferrer(post, fb), "utm_source=facebook&utm_medium=paid&utm_campaign=en-kidsit-vs-chatgpt&utm_content=article");
  const tt = touch("?ttclid=E.C.P.abc&utm_campaign=Launch%20HE");
  assert.equal(ctFor(post, tt), "ad-tiktok-launch-he-en");
  // long campaign: lang dropped before the campaign gets too short; ≤ 40
  const longCamp = touch("?utm_source=facebook&utm_medium=paid_social&utm_campaign=" + "summer-2027-parents-of-toddlers-retargeting");
  const c = ctFor(post, longCamp);
  assert.ok(c.length <= 40 && c.startsWith("ad-facebook-"), c);
  assert.equal(c, "ad-facebook-summer-2027-parents-of-to-en");
  // Hebrew-only campaign name: ct falls back to lang-page, Play keeps the raw value (encoded once)
  const heCamp = touch("?utm_source=ig&utm_medium=cpc&utm_campaign=" + encodeURIComponent("מבצע חורף"));
  assert.equal(ctFor(post, heCamp), "ad-instagram-en-kidsit-vs-chatgpt");
  assert.equal(ref(playStoreHref(post, heCamp)).get("utm_campaign"), "מבצע חורף");
  assert.match(playStoreHref(post, heCamp), /utm_campaign%3D%25D7%259E/);
});

test("data attributes round-trip and reject unknown values", () => {
  const d = storeLinkData("play", bar);
  assert.deepEqual(storeLinkFromData((n) => d[n] ?? null), { kind: "play", link: bar });
  assert.equal(storeLinkFromData((n) => ({ ...d, "data-store-lang": "fr" })[n] ?? null), null);
  assert.equal(storeLinkFromData((n) => ({ ...d, "data-store-placement": "x" })[n] ?? null), null);
});

test("helpers", () => {
  assert.equal(resolveProviderToken(), "128661105");
  assert.equal(resolveProviderToken("12ab"), "");
  assert.equal(campaignToken("Kidsit vs ChatGPT!"), "kidsit-vs-chatgpt");
  assert.equal(campaignToken("עברית"), "site");
  assert.equal(APP_STORE_URL, "https://apps.apple.com/us/app/parent-coach-ai-kidsit/id6769443099");
  assert.equal(PLAY_STORE_URL, "https://play.google.com/store/apps/details?id=ai.kidsit.app");
});
