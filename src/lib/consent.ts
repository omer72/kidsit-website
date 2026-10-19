// Cookie/storage consent (first-party, localStorage 'kidsit-consent').
// { v: version, ts: ISO time, analytics: bool }; valid 12 months; re-prompt on expiry or version change.
// Pattern follows IKA (ika-site/src/lib/consent.js); kidsit only has an analytics category (GA4).

export const CONSENT_VERSION = 1;
export const CONSENT_KEY = "kidsit-consent";
export const GA_ID = "G-MJH3YYBHJ0";
const YEAR = 365 * 24 * 3600 * 1000;
const GA_DISABLE = `ga-disable-${GA_ID}`;

export type Consent = { v: number; ts: string; analytics: boolean };

export function readConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null") as Consent | null;
    if (!c || c.v !== CONSENT_VERSION || !c.ts || Date.now() - Date.parse(c.ts) > YEAR) return null;
    return c;
  } catch {
    return null;
  }
}

export const hasConsent = (cat: "essential" | "analytics") => cat === "essential" || !!readConsent()?.analytics;
export const decided = () => !!readConsent();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __kidsitGaLoaded?: boolean;
    __kidsitNetPatched?: { fetch: typeof fetch; sendBeacon?: typeof navigator.sendBeacon };
    [key: string]: unknown;
  }
}

function ensureGtagStub() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
}

/** Delete GA cookies on this host and the parent domain (e.g. .kidsit.ai). */
export function clearGaCookies() {
  if (typeof document === "undefined") return;
  const names = document.cookie.split(";").map((c) => c.trim().split("=")[0]);
  const ga = names.filter((n) => n === "_ga" || n.startsWith("_ga_"));
  if (!ga.length) return;
  const host = location.hostname;
  const parts = host.split(".");
  const domains = ["", host];
  if (parts.length >= 2) domains.push("." + parts.slice(-2).join("."));
  if (parts.length >= 3) domains.push("." + parts.slice(-3).join("."));
  for (const name of ga) {
    for (const d of domains) {
      const domain = d ? `; domain=${d}` : "";
      document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
    }
  }
}

/** Stop any further GA / Ads hits on this page immediately (Accept → Reject). */
export function disableAnalytics() {
  // Must be set before any further hit (Google's documented kill switch).
  window[GA_DISABLE] = true;
  // Drop event/config calls; still allow a local consent update for completeness.
  ensureGtagStub();
  const push = window.gtag!;
  window.gtag = function gtag(...args: unknown[]) {
    if (args[0] === "consent") push(...args);
  };
  window.gtag("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  // Swallow beacons / fetch to Google analytics & ads endpoints for the rest of this page load.
  // Any Google Analytics / Tag Manager / Ads collect endpoint (incl. googletagmanager.com/a).
  const block = (url: string) =>
    /google-analytics\.com|googletagmanager\.com|google\.[a-z.]+\/(g\/)?collect|doubleclick\.net|googlesyndication|pagead2/.test(
      String(url),
    );
  if (!window.__kidsitNetPatched) {
    const sb = navigator.sendBeacon?.bind(navigator);
    const origFetch = window.fetch.bind(window);
    window.__kidsitNetPatched = { fetch: origFetch, sendBeacon: sb };
    if (sb) {
      navigator.sendBeacon = (url, data?) => (block(String(url)) ? true : sb(url, data));
    }
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (block(url)) return Promise.resolve(new Response(null, { status: 204 }));
      return origFetch(input, init);
    }) as typeof fetch;
  }
  // Stop the library from loading further if a script tag is still mid-flight.
  document.querySelectorAll('script[src*="googletagmanager.com/gtag"]').forEach((el) => el.remove());
  clearGaCookies();
}

/** Load gtag.js once and configure GA4. Call only after analytics consent. */
export function loadAnalytics() {
  if (typeof window === "undefined") return;
  window[GA_DISABLE] = false;
  // Undo a same-page Reject network patch if the visitor accepts again.
  if (window.__kidsitNetPatched) {
    window.fetch = window.__kidsitNetPatched.fetch;
    if (window.__kidsitNetPatched.sendBeacon) navigator.sendBeacon = window.__kidsitNetPatched.sendBeacon;
    delete window.__kidsitNetPatched;
  }
  if (window.__kidsitGaLoaded) {
    // Re-enabled after a previous reject on the same page: restore consent and re-config.
    ensureGtagStub();
    window.gtag!("consent", "update", { analytics_storage: "granted" });
    window.gtag!("config", GA_ID);
    return;
  }
  ensureGtagStub();
  window.gtag!("consent", "update", { analytics_storage: "granted" });
  const s = document.createElement("script");
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  s.async = true;
  s.onload = () => {
    window.gtag!("js", new Date());
    window.gtag!("config", GA_ID);
  };
  document.head.appendChild(s);
  window.__kidsitGaLoaded = true;
}

export function saveConsent({ analytics = false }: { analytics?: boolean }): Consent {
  const c: Consent = { v: CONSENT_VERSION, ts: new Date().toISOString(), analytics: !!analytics };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  } catch {
    /* storage blocked */
  }
  document.documentElement.classList.remove("consent-needed");
  if (c.analytics) loadAnalytics();
  else disableAnalytics();
  window.dispatchEvent(new CustomEvent("kidsit-consent", { detail: c }));
  return c;
}

export const openConsentSettings = () => window.dispatchEvent(new CustomEvent("kidsit-consent-open"));
