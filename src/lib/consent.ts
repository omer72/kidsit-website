// Cookie/storage consent (first-party, localStorage 'kidsit-consent').
// { v: version, ts: ISO time, analytics: bool }; valid 12 months; re-prompt on expiry or version change.
// Pattern follows IKA (ika-site/src/lib/consent.js); kidsit only has an analytics category (GA4).

export const CONSENT_VERSION = 1;
export const CONSENT_KEY = "kidsit-consent";
export const GA_ID = "G-MJH3YYBHJ0";
const YEAR = 365 * 24 * 3600 * 1000;

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

/** Load gtag.js once and configure GA4. Call only after analytics consent. */
export function loadAnalytics() {
  if (typeof window === "undefined" || window.__kidsitGaLoaded) return;
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
  else {
    ensureGtagStub();
    window.gtag!("consent", "update", { analytics_storage: "denied" });
  }
  window.dispatchEvent(new CustomEvent("kidsit-consent", { detail: c }));
  return c;
}

export const openConsentSettings = () => window.dispatchEvent(new CustomEvent("kidsit-consent-open"));
