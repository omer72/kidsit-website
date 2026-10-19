import type { Lang } from "@/dictionaries";

type Store = "apple" | "play";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// GA4 custom event for App Store / Google Play button clicks (mark it as a Key event in GA4).
// gtag.js loads lazily, so if it isn't there yet we queue the call on dataLayer the same way the
// gtag() stub does; gtag.js replays the queue when it loads.
export function trackStoreClick(store: Store, lang: Lang, placement: string, url: string) {
  if (typeof window === "undefined") return;
  const params = {
    platform: store === "apple" ? "ios" : "android",
    store: store === "apple" ? "app_store" : "google_play",
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
