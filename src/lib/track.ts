import type { Lang } from "@/dictionaries";

type Store = "apple" | "play";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire our `store_click` gtag event for App Store buttons only.
 *
 * Play Store is intentionally skipped: GA4 already has a configured `play_store_click`
 * event (observed on Play clicks only in earlier verification — extra.py clicked the
 * Play button and collected both our store_click and the GA-side play_store_click).
 * Sending store_click for Play would double-count. No equivalent GA-side App Store event
 * was observed, so App Store still needs store_click.
 *
 * Mark store_click as a Key event in GA4 for App Store reporting.
 * gtag.js loads lazily, so if it isn't there yet we queue on dataLayer the same way the
 * gtag() stub does; gtag.js replays the queue when it loads.
 */
export function trackStoreClick(store: Store, lang: Lang, placement: string, url: string) {
  if (typeof window === "undefined") return;
  if (store === "play") return;
  const params = {
    platform: "ios",
    store: "app_store",
    page_language: lang,
    placement,
    link_url: url,
    transport_type: "beacon",
  };
  if (typeof window.gtag === "function") {
    window.gtag("event", "store_click", params);
  } else {
    window.dataLayer = window.dataLayer || [];
    queue("event", "store_click", params);
  }
}

// Same shape as the official gtag() stub: gtag.js expects the Arguments object, not an array.
function queue(...args: unknown[]): void;
function queue() {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer!.push(arguments);
}
