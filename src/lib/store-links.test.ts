import assert from "node:assert/strict";
import test from "node:test";
import { APP_STORE_PROVIDER_TOKEN, APP_STORE_URL, PLAY_STORE_URL } from "../dictionaries";
import {
  APP_STORE_CT_MAX,
  BLOG_INDEX_CAMPAIGN,
  appStoreHref,
  campaignToken,
  HOME_CAMPAIGN,
  storeHref,
  playStoreHref,
  resolveProviderToken,
} from "./store-links";

const blog = { medium: "blog" as const, campaign: "kidsit-vs-chatgpt" };
const home = { medium: "home" as const, campaign: HOME_CAMPAIGN };

test("Play: blog link keeps id= and carries a once-encoded referrer", () => {
  assert.equal(
    playStoreHref(blog),
    "https://play.google.com/store/apps/details?id=ai.kidsit.app&referrer=utm_source%3Dkidsit.ai%26utm_medium%3Dblog%26utm_campaign%3Dkidsit-vs-chatgpt",
  );
  const ref = new URL(playStoreHref(blog)).searchParams.get("referrer");
  assert.equal(ref, "utm_source=kidsit.ai&utm_medium=blog&utm_campaign=kidsit-vs-chatgpt");
  assert.equal(new URL(playStoreHref(blog)).searchParams.get("id"), "ai.kidsit.app");
});

test("Play: home medium, campaign exactly home", () => {
  assert.equal(
    playStoreHref(home),
    "https://play.google.com/store/apps/details?id=ai.kidsit.app&referrer=utm_source%3Dkidsit.ai%26utm_medium%3Dhome%26utm_campaign%3Dhome",
  );
});

test("Play: uses ? when the base has no query and keeps hl=", () => {
  assert.equal(
    playStoreHref(blog, "https://play.google.com/store/apps/details"),
    "https://play.google.com/store/apps/details?referrer=utm_source%3Dkidsit.ai%26utm_medium%3Dblog%26utm_campaign%3Dkidsit-vs-chatgpt",
  );
  const withHl = new URL(playStoreHref(blog, "https://play.google.com/store/apps/details?id=ai.kidsit.app&hl=he"));
  assert.equal(withHl.searchParams.get("hl"), "he");
  assert.equal(withHl.searchParams.get("id"), "ai.kidsit.app");
  // an existing referrer is replaced, not duplicated
  const twice = playStoreHref(blog, playStoreHref(home));
  assert.equal(new URL(twice).searchParams.getAll("referrer").length, 1);
  assert.match(twice, /utm_medium%3Dblog/);
});

test("App Store: fixed pt, ct, mt=8 in App Store Connect order", () => {
  assert.equal(APP_STORE_PROVIDER_TOKEN, "128661105");
  assert.equal(storeHref("apple", blog), `${APP_STORE_URL}?pt=128661105&ct=kidsit-vs-chatgpt&mt=8`);
  assert.equal(storeHref("apple", home), `${APP_STORE_URL}?pt=128661105&ct=home&mt=8`);
  assert.equal(
    storeHref("apple", { medium: "blog", campaign: BLOG_INDEX_CAMPAIGN }),
    `${APP_STORE_URL}?pt=128661105&ct=blog-index&mt=8`,
  );
  // matches the reference campaign link's parameters
  const ref = new URL("https://apps.apple.com/app/apple-store/id6769443099?pt=128661105&ct=blog&mt=8");
  const ours = new URL(appStoreHref({ medium: "blog", campaign: "blog" }, "128661105", ref.origin + ref.pathname));
  assert.equal(ours.toString(), ref.toString());
});

test("App Store: pt left out when the token is empty, existing pt/ct/mt not duplicated", () => {
  assert.equal(appStoreHref(blog, ""), `${APP_STORE_URL}?ct=kidsit-vs-chatgpt&mt=8`);
  const again = new URL(appStoreHref(home, "1", appStoreHref(blog)));
  assert.equal(again.search, "?pt=1&ct=home&mt=8");
});

test("App Store: ct is cut to 40 characters without a trailing dash", () => {
  const long = "a-very-long-blog-post-slug-that-goes-on-and-on-forever";
  const ct = new URL(appStoreHref({ medium: "blog", campaign: long }, "")).searchParams.get("ct")!;
  assert.ok(ct.length <= APP_STORE_CT_MAX, `ct ${ct.length} chars`);
  assert.equal(ct, "a-very-long-blog-post-slug-that-goes-on");
  assert.ok(!ct.endsWith("-"));
  const exact = "x".repeat(40);
  assert.equal(new URL(appStoreHref({ medium: "blog", campaign: exact + "yz" }, "")).searchParams.get("ct"), exact);
  // Play keeps the full slug (no 40-char limit there)
  assert.match(playStoreHref({ medium: "blog", campaign: long }), /utm_campaign%3Da-very-long-blog-post-slug-that-goes-on-and-on-forever$/);
});

test("campaign tokens are URL-safe and never empty", () => {
  assert.equal(campaignToken("Kidsit vs ChatGPT!"), "kidsit-vs-chatgpt");
  assert.equal(campaignToken("a&b=c"), "a-b-c");
  assert.equal(campaignToken("עברית"), "site");
  assert.equal(campaignToken("--x--"), "x");
  const encoded = playStoreHref({ medium: "blog", campaign: "a&b=c d" });
  assert.equal(new URL(encoded).searchParams.get("referrer"), "utm_source=kidsit.ai&utm_medium=blog&utm_campaign=a-b-c-d");
});

test("provider token: trimmed, digits only, otherwise empty", () => {
  assert.equal(resolveProviderToken(), "128661105");
  assert.equal(resolveProviderToken(" 128661105 "), "128661105");
  assert.equal(resolveProviderToken(""), "");
  assert.equal(resolveProviderToken("12ab"), "");
});

test("canonical constants stay clean (used by JSON-LD)", () => {
  assert.equal(APP_STORE_URL, "https://apps.apple.com/us/app/parent-coach-ai-kidsit/id6769443099");
  assert.equal(PLAY_STORE_URL, "https://play.google.com/store/apps/details?id=ai.kidsit.app");
});
