/**
 * First-touch source detection for store-click attribution (pure, no DOM; unit tested in attribution.test.ts).
 *
 * Precedence: utm_source > click id (gclid → google, fbclid → facebook, ttclid → tiktok) > document.referrer host > direct.
 * Paid = utm_medium in PAID_MEDIUMS, or any click id present.
 * Referrer: AI chats → ai-<name>; google.* / bing / facebook / instagram / tiktok → that name;
 * empty or same site → "direct"; anything else → "referral" (the host itself is not kept, so ct stays short).
 */
export type Touch = {
  v: 1;
  /** Normalized source token: direct | referral | ai-chatgpt | google | … or a sanitized utm_source. */
  source: string;
  paid: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  /** Landing path (no query), for debugging only. */
  landing?: string;
};

export const TOUCH_KEY = "kidsit-first-touch";
/** GA4 event parameter values are cut at 100 characters; we keep every stored value within that. */
export const MAX_VALUE = 100;

const AI_SOURCES: [RegExp, string][] = [
  [/^(chatgpt(\.com)?|chat\.openai\.com|openai(\.com)?)$/, "ai-chatgpt"],
  [/^(perplexity(\.ai)?)$/, "ai-perplexity"],
  [/^(gemini(\.google\.com)?|bard(\.google\.com)?)$/, "ai-gemini"],
  [/^(copilot(\.microsoft\.com)?|bing-?copilot)$/, "ai-copilot"],
  [/^(claude(\.ai)?|anthropic)$/, "ai-claude"],
];
const NAMED_SOURCES: [RegExp, string][] = [
  [/^(google|google\.[a-z.]+|adwords|google-?ads)$/, "google"],
  [/^(bing|bing\.com|microsoft-?ads)$/, "bing"],
  [/^(facebook|fb|meta|facebook\.com|[a-z]+\.facebook\.com)$/, "facebook"],
  [/^(instagram|ig|instagram\.com|l\.instagram\.com)$/, "instagram"],
  [/^(tiktok|tiktok\.com)$/, "tiktok"],
];

const REFERRER_HOSTS: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|^chat\.openai\.com$/, "ai-chatgpt"],
  [/(^|\.)perplexity\.ai$/, "ai-perplexity"],
  [/^gemini\.google\.com$|^bard\.google\.com$/, "ai-gemini"],
  [/^copilot\.microsoft\.com$/, "ai-copilot"],
  [/(^|\.)claude\.ai$/, "ai-claude"],
  [/(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)facebook\.com$|^fb\.me$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
];

const PAID_MEDIUMS = /^(cpc|ppc|cpm|cpv|cpa|paid|paid[_-]?(social|search|media|ads?)|social[_-]?paid|ads?|display|sem|sponsored|retargeting)$/;

export const isPaidMedium = (medium: string | undefined) => !!medium && PAID_MEDIUMS.test(medium.trim().toLowerCase());

/** Lowercase token of [a-z0-9._-], at most `max` chars, no leading/trailing separators. May be empty. */
export function token(raw: string, max = 40): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, max)
    .replace(/[-._]+$/g, "");
}

const stripHost = (h: string) => h.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");

/** Map a utm_source value to our source token. Unknown values keep a sanitized form (≤ 20 chars), or "other". */
export function normalizeSource(raw: string): string {
  const s = stripHost(raw.trim().replace(/^https?:\/\//i, "").split("/")[0]);
  for (const [re, name] of [...AI_SOURCES, ...NAMED_SOURCES]) if (re.test(s)) return name;
  return token(s, 20) || "other";
}

/** Map a referrer URL to a source token. Same site (incl. www. / subdomains of siteHost) or empty → direct. */
export function sourceFromReferrer(referrer: string, siteHost: string): string {
  if (!referrer) return "direct";
  let host: string;
  try {
    host = stripHost(new URL(referrer).hostname);
  } catch {
    return "direct";
  }
  const site = stripHost(siteHost.split(":")[0]);
  if (!host || host === site || host.endsWith("." + site) || site.endsWith("." + host)) return "direct";
  for (const [re, name] of REFERRER_HOSTS) if (re.test(host)) return name;
  return "referral";
}

const clip = (v: string | null) => {
  const t = (v ?? "").trim();
  return t ? t.slice(0, MAX_VALUE) : undefined;
};

export function detectTouch(input: { href: string; referrer: string; siteHost: string }): Touch {
  let params = new URLSearchParams();
  let landing: string | undefined;
  try {
    const u = new URL(input.href);
    params = u.searchParams;
    landing = u.pathname;
  } catch {
    /* keep defaults */
  }
  const t: Touch = { v: 1, source: "direct", paid: false, landing };
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid", "ttclid"] as const) {
    const v = clip(params.get(k));
    if (v) t[k] = v;
  }
  if (t.utm_source) t.source = normalizeSource(t.utm_source);
  else if (t.gclid) t.source = "google";
  else if (t.fbclid) t.source = "facebook";
  else if (t.ttclid) t.source = "tiktok";
  else t.source = sourceFromReferrer(input.referrer, input.siteHost);
  t.paid = isPaidMedium(t.utm_medium) || !!(t.gclid || t.fbclid || t.ttclid);
  return t;
}

type Store = Pick<Storage, "getItem" | "setItem">;
let memory: Touch | null = null;

function isTouch(x: unknown): x is Touch {
  return !!x && typeof x === "object" && (x as Touch).v === 1 && typeof (x as Touch).source === "string";
}

/**
 * First touch of this session: the stored one if present, otherwise detect and store it.
 * Storage can be missing or throw (Safari private mode, blocked storage); then an in-memory copy is used.
 */
export function firstTouch(
  input: { href: string; referrer: string; siteHost: string },
  storage: Store | null | undefined,
): Touch {
  try {
    const raw = storage?.getItem(TOUCH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isTouch(parsed)) return parsed;
    }
  } catch {
    /* fall through */
  }
  if (memory) return memory;
  const t = detectTouch(input);
  memory = t;
  try {
    storage?.setItem(TOUCH_KEY, JSON.stringify(t));
  } catch {
    /* memory only */
  }
  return t;
}

/** Test hook. */
export function resetTouchMemory() {
  memory = null;
}

/** The click id that wins for reporting (gclid, then fbclid, then ttclid). */
export function clickId(t: Touch): { type: "gclid" | "fbclid" | "ttclid"; value: string } | null {
  if (t.gclid) return { type: "gclid", value: t.gclid };
  if (t.fbclid) return { type: "fbclid", value: t.fbclid };
  if (t.ttclid) return { type: "ttclid", value: t.ttclid };
  return null;
}
