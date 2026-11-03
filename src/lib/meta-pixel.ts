// Meta Pixel follows the banner's only non-essential category, analytics.
// Choice lives in localStorage "kidsit-consent" ({ v, ts, analytics }), same window as readConsent().

import { CONSENT_VERSION } from "./consent";

export const META_PIXEL_ID = "1684532029907797";
export const META_PIXEL_SRC = "https://connect.facebook.net/en_US/fbevents.js";
/** 12 months. Matches consent.ts and the consent-needed head script (31536e6). */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 3600 * 1000;

export type MetaPixelFbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFbq;
    _fbq?: MetaPixelFbq;
    /** Live analytics choice maintained by the head bootstrap. False after withdraw. */
    __kidsitMetaGranted?: boolean;
    __kidsitMetaBootstrap?: number;
  }
}

/** True when a stored choice would allow the pixel. Invalid, expired, or declined is false. */
export function metaConsentAllowsPixel(raw: unknown, now = Date.now()): boolean {
  if (!raw || typeof raw !== "object") return false;
  const c = raw as { v?: unknown; ts?: unknown; analytics?: unknown };
  if (c.v !== CONSENT_VERSION || !c.ts) return false;
  if (typeof c.ts !== "string" && typeof c.ts !== "number") return false;
  if (now - Date.parse(String(c.ts)) > CONSENT_MAX_AGE_MS) return false;
  return !!c.analytics;
}

/**
 * The head bootstrap's flag wins when it is set, so a same-page withdraw stops route hits
 * even if storage was just updated. Undefined falls back to the stored choice.
 */
export function hasMetaConsent(input: {
  grantedFlag: boolean | undefined;
  stored: unknown;
  now?: number;
}): boolean {
  if (typeof input.grantedFlag === "boolean") return input.grantedFlag;
  return metaConsentAllowsPixel(input.stored, input.now ?? Date.now());
}

/** fbevents.js installs callMethod. The pre-consent stub only has a queue, and queuing would send later. */
export function isMetaPixelLoaded(fbq: unknown): fbq is (...args: unknown[]) => void {
  if (typeof fbq !== "function") return false;
  return typeof (fbq as { callMethod?: unknown }).callMethod === "function";
}

/** First path is the document load (head snippet). Same path and a bare stub never send. */
export function shouldTrackMetaRouteChange(input: {
  isFirstObservedPath: boolean;
  samePath: boolean;
  analyticsConsent: boolean;
  pixelLoaded: boolean;
}): boolean {
  if (input.isFirstObservedPath || input.samePath) return false;
  return input.analyticsConsent && input.pixelLoaded;
}
