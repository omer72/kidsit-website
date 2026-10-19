import type { Lang } from "@/dictionaries";
import { hasConsent } from "@/lib/consent";

type Store = "apple" | "play";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire our `store_click` gtag event for App Store buttons only, and only after analytics consent.
 *
 * Play Store is skipped: GA already fires play_store_click on Play links. No equivalent GA-side
 * App Store event was observed, so App Store still needs store_click once the visitor accepts.
 */
export function trackStoreClick(store: Store, lang: Lang, placement: string, url: string) {
  if (typeof window === "undefined") return;
  if (store === "play") return;
  if (!hasConsent("analytics")) return;
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

function queue(...args: unknown[]): void;
function queue() {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer!.push(arguments);
}
