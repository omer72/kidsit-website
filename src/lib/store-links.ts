import { APP_STORE_PROVIDER_TOKEN as APP_STORE_PROVIDER_TOKEN_CONSTANT, APP_STORE_URL, PLAY_STORE_URL } from "../dictionaries";

/**
 * The one place that builds clickable App Store / Google Play links. Every store button and every
 * store link in a blog post goes through storeHref(); JSON-LD keeps the clean APP_STORE_URL / PLAY_STORE_URL.
 *
 * Google Play: referrer=utm_source=kidsit.ai&utm_medium=<medium>&utm_campaign=<campaign>, URL-encoded once.
 * App Store:   pt=<provider token>&ct=<campaign, max 40 chars>&mt=8 (same order as App Store Connect's campaign link);
 *              pt is left out only if the token constant is ever emptied.
 */
export type StoreMedium = "blog" | "home";
export type StoreLink = { medium: StoreMedium; campaign: string };
export type StoreKind = "apple" | "play";

export const STORE_UTM_SOURCE = "kidsit.ai";
/** App Store Connect rejects/cuts campaign tokens (ct) longer than 40 characters. */
export const APP_STORE_CT_MAX = 40;
/** Campaign for the blog index pages (both languages share it; utm_medium is "blog"). */
export const BLOG_INDEX_CAMPAIGN = "blog-index";
/** Campaign (ct / utm_campaign) for the home pages: exactly "home" in both languages. */
export const HOME_CAMPAIGN = "home";

/** The fixed provider token from src/dictionaries.ts; only digits are accepted, anything else counts as empty (pt left out). */
export function resolveProviderToken(token: string = APP_STORE_PROVIDER_TOKEN_CONSTANT): string {
  const t = token.trim();
  return /^\d+$/.test(t) ? t : "";
}

/** Lowercase [a-z0-9._-] only, no leading/trailing separators, at most `max` characters; never empty. */
export function campaignToken(campaign: string, max = Infinity): string {
  const clean = campaign
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");
  const cut = clean.slice(0, max).replace(/[-._]+$/g, "");
  return cut || "site";
}

export function playStoreHref(link: StoreLink, base: string = PLAY_STORE_URL): string {
  const url = new URL(base);
  const referrer = `utm_source=${STORE_UTM_SOURCE}&utm_medium=${link.medium}&utm_campaign=${campaignToken(link.campaign)}`;
  url.searchParams.set("referrer", referrer); // keeps id= / hl=; encodes = and & once (%3D, %26)
  return url.toString();
}

export function appStoreHref(
  link: StoreLink,
  providerToken: string = resolveProviderToken(),
  base: string = APP_STORE_URL,
): string {
  const url = new URL(base);
  const q = new URLSearchParams();
  url.searchParams.forEach((v, k) => {
    if (k !== "pt" && k !== "ct" && k !== "mt") q.append(k, v);
  });
  if (providerToken) q.set("pt", providerToken);
  q.set("ct", campaignToken(link.campaign, APP_STORE_CT_MAX));
  q.set("mt", "8"); // 8 = iOS apps
  url.search = q.toString();
  return url.toString();
}

export function storeHref(kind: StoreKind, link: StoreLink): string {
  return kind === "apple" ? appStoreHref(link) : playStoreHref(link);
}
