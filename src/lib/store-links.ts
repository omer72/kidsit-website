import { APP_STORE_PROVIDER_TOKEN as APP_STORE_PROVIDER_TOKEN_CONSTANT, APP_STORE_URL, PLAY_STORE_URL } from "../dictionaries";
import { MAX_VALUE, token, type Touch } from "./attribution";

/**
 * The one place that builds clickable App Store / Google Play links. Every store button and every
 * store link in a blog post goes through storeHref(); JSON-LD keeps the clean APP_STORE_URL / PLAY_STORE_URL.
 *
 * Server-rendered (default, and for "direct" visitors after hydration):
 *   App Store  ?pt=<token>&ct=<lang>-<page>[-<pl>]&mt=8      e.g. he-home-hero, en-kidsit-vs-chatgpt-bar
 *   Play       referrer = utm_source=kidsit.ai&utm_medium=<home|blog>&utm_campaign=<lang>-<page>&utm_content=<placement>
 * With a detected first touch (client only, see components/store-attribution.tsx):
 *   organic    ct = <source>-<default ct>                   e.g. ai-chatgpt-en-kidsit-vs-chatgpt
 *              Play utm_source=<source>, utm_medium/utm_campaign/utm_content as default
 *   paid       ct = ad-<source>-<utm_campaign>[-<lang>]     e.g. ad-google-spring_sale-he
 *              Play carries the landing utm set (source, medium, campaign, content) and gclid when allowed
 * ct is at most 40 characters (App Store Connect limit), cut on the variable part, never ending in a separator.
 */
export type StoreMedium = "blog" | "home";
export type StoreKind = "apple" | "play";
/** Where on the page the button sits. ct shortens pricing_free/pricing_premium to "pricing" and drops "article". */
export type StorePlacement = "hero" | "pricing_free" | "pricing_premium" | "article" | "bar";
export type StoreLink = {
  medium: StoreMedium;
  lang: "he" | "en";
  /** Page token: HOME_PAGE, BLOG_INDEX_PAGE or the post slug. */
  page: string;
  placement: StorePlacement;
};

export const STORE_UTM_SOURCE = "kidsit.ai";
/** App Store Connect cuts campaign tokens (ct) longer than 40 characters. */
export const APP_STORE_CT_MAX = 40;
export const HOME_PAGE = "home";
export const BLOG_INDEX_PAGE = "blog-index";

const PL_CT: Record<StorePlacement, string> = {
  hero: "hero",
  pricing_free: "pricing",
  pricing_premium: "pricing",
  article: "",
  bar: "bar",
};

/** The fixed provider token from src/dictionaries.ts; only digits are accepted, anything else counts as empty (pt left out). */
export function resolveProviderToken(t: string = APP_STORE_PROVIDER_TOKEN_CONSTANT): string {
  const s = t.trim();
  return /^\d+$/.test(s) ? s : "";
}

/** Lowercase [a-z0-9._-] only, no leading/trailing separators, at most `max` characters; never empty. */
export function campaignToken(campaign: string, max = Infinity): string {
  return token(campaign, max) || "site";
}

/**
 * prefix-variable-suffix-optional, at most `max` chars. The variable part is cut first (it keeps ≥ 3 chars);
 * if that is not enough, `optional` is dropped, then `suffix`. Never ends in a separator.
 */
function fit(prefix: string, variable: string, suffix: string, max: number, optional = ""): string {
  const join = (...p: string[]) => p.filter(Boolean).join("-");
  const full = join(prefix, variable, suffix, optional);
  if (full.length <= max) return full;
  for (const [suf, opt] of [[suffix, optional], [suffix, ""], ["", ""]]) {
    const fixed = join(prefix, suf, opt).length + 1; // +1 for the separator before the variable part
    const v = token(variable, max - fixed);
    if (max - fixed >= 3 && v) return join(prefix, v, suf, opt);
  }
  return token(prefix, max);
}

/** Default ct: <lang>-<page>[-<pl>], page cut first so lang and placement survive. */
export function defaultCt(link: StoreLink): string {
  return fit(link.lang, token(link.page, 200) || "site", PL_CT[link.placement], APP_STORE_CT_MAX);
}

export function ctFor(link: StoreLink, touch?: Touch | null): string {
  if (!touch || touch.source === "direct") return defaultCt(link);
  if (touch.paid) {
    // ad-<source>-<campaign>[-<lang>]: source ≤ 12 chars; campaign falls back to the page token; lang only if it fits.
    const src = token(touch.source, 12) || "other";
    const utmCamp = token(touch.utm_campaign ?? "", 200);
    const camp = utmCamp || `${link.lang}-${token(link.page, 200) || "site"}`;
    return fit(`ad-${src}`, camp, "", APP_STORE_CT_MAX, utmCamp ? link.lang : "");
  }
  // organic source: <source>-<lang>-<page>[-<pl>], page cut first.
  const src = token(touch.source, 16) || "other";
  return fit(`${src}-${link.lang}`, token(link.page, 200) || "site", PL_CT[link.placement], APP_STORE_CT_MAX);
}

export function playReferrer(link: StoreLink, touch?: Touch | null, opts: { includeClickId?: boolean } = {}): string {
  const q = new URLSearchParams();
  const campaign = `${link.lang}-${campaignToken(link.page)}`;
  if (touch && touch.source !== "direct" && touch.paid) {
    const clip = (v: string) => v.slice(0, MAX_VALUE);
    q.set("utm_source", clip(touch.utm_source ?? touch.source));
    q.set("utm_medium", clip(touch.utm_medium ?? "paid"));
    q.set("utm_campaign", clip(touch.utm_campaign ?? campaign));
    q.set("utm_content", clip(touch.utm_content ?? link.placement));
    if (opts.includeClickId && touch.gclid) q.set("gclid", touch.gclid);
  } else {
    q.set("utm_source", touch && touch.source !== "direct" ? touch.source : STORE_UTM_SOURCE);
    q.set("utm_medium", link.medium);
    q.set("utm_campaign", campaign);
    q.set("utm_content", link.placement);
  }
  return q.toString();
}

export function playStoreHref(
  link: StoreLink,
  touch?: Touch | null,
  opts: { includeClickId?: boolean } = {},
  base: string = PLAY_STORE_URL,
): string {
  const url = new URL(base);
  url.searchParams.set("referrer", playReferrer(link, touch, opts)); // keeps id= / hl=; the referrer is encoded once more as a whole
  return url.toString();
}

export function appStoreHref(
  link: StoreLink,
  touch?: Touch | null,
  providerToken: string = resolveProviderToken(),
  base: string = APP_STORE_URL,
): string {
  const url = new URL(base);
  const q = new URLSearchParams();
  url.searchParams.forEach((v, k) => {
    if (k !== "pt" && k !== "ct" && k !== "mt") q.append(k, v);
  });
  if (providerToken) q.set("pt", providerToken);
  q.set("ct", ctFor(link, touch));
  q.set("mt", "8"); // 8 = iOS apps
  url.search = q.toString();
  return url.toString();
}

export function storeHref(kind: StoreKind, link: StoreLink, touch?: Touch | null, opts: { includeClickId?: boolean } = {}): string {
  return kind === "apple" ? appStoreHref(link, touch) : playStoreHref(link, touch, opts);
}

/** data-* attributes that let the client re-build a link (store-attribution.tsx). Same keys in JSX and in blog HTML. */
export function storeLinkData(kind: StoreKind, link: StoreLink): Record<string, string> {
  return {
    "data-store": kind,
    "data-store-medium": link.medium,
    "data-store-lang": link.lang,
    "data-store-page": link.page,
    "data-store-placement": link.placement,
  };
}

const MEDIUMS: StoreMedium[] = ["blog", "home"];
const PLACEMENTS: StorePlacement[] = ["hero", "pricing_free", "pricing_premium", "article", "bar"];

/** Read the data-* attributes back; null if anything is missing or unknown. */
export function storeLinkFromData(get: (name: string) => string | null): { kind: StoreKind; link: StoreLink } | null {
  const kind = get("data-store");
  const medium = get("data-store-medium") as StoreMedium | null;
  const lang = get("data-store-lang");
  const page = get("data-store-page");
  const placement = get("data-store-placement") as StorePlacement | null;
  if ((kind !== "apple" && kind !== "play") || !medium || !MEDIUMS.includes(medium)) return null;
  if ((lang !== "he" && lang !== "en") || !page || !placement || !PLACEMENTS.includes(placement)) return null;
  return { kind, link: { medium, lang, page, placement } };
}
