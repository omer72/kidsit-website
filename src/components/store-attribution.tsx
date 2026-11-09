"use client";

import { useEffect } from "react";
import { clickId, firstTouch, type Touch } from "@/lib/attribution";
import { readConsent } from "@/lib/consent";
import { storeHref, storeLinkFromData } from "@/lib/store-links";

const SELECTOR = "a[data-store]";

function session(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** gclid goes into the Play referrer only with analytics consent (it is a Google Ads click identifier). */
const allowClickIds = () => !!readConsent()?.analytics;

function rebuild(a: HTMLAnchorElement, touch: Touch) {
  const parsed = storeLinkFromData((n) => a.getAttribute(n));
  if (!parsed) return null;
  const href = storeHref(parsed.kind, parsed.link, touch, { includeClickId: allowClickIds() });
  if (a.getAttribute("href") !== href) a.setAttribute("href", href);
  return parsed;
}

/**
 * After hydration: read/store the session's first touch, re-build every store link for it, and send a
 * GA4 `store_click` event on click. Direct visitors keep the server-rendered hrefs (rebuild gives the same URL).
 * GA4 itself is untouched: the event is sent only when gtag exists AND analytics consent is stored
 * (gtag.js is loaded by components/analytics.tsx after consent). Navigation is never delayed.
 */
export function StoreAttribution() {
  useEffect(() => {
    const touch = firstTouch(
      { href: location.href, referrer: document.referrer, siteHost: location.host },
      session(),
    );
    const all = () => document.querySelectorAll<HTMLAnchorElement>(SELECTOR).forEach((a) => rebuild(a, touch));
    all();
    // Client-side navigation and the sticky bar mount new links later.
    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        all();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.(SELECTOR) as HTMLAnchorElement | null;
      if (!a) return;
      const parsed = rebuild(a, touch); // href is final before the browser follows it
      if (!parsed || typeof window.gtag !== "function" || !readConsent()?.analytics) return;
      const id = clickId(touch);
      try {
        const params: Record<string, string | number | undefined> = {
          store: parsed.kind === "apple" ? "app_store" : "google_play",
          source: touch.source,
          page: parsed.link.page,
          lang: parsed.link.lang,
          placement: parsed.link.placement,
          link_medium: parsed.link.medium,
          paid: touch.paid ? 1 : 0,
          utm_source: touch.utm_source,
          utm_medium: touch.utm_medium,
          utm_campaign: touch.utm_campaign,
          utm_content: touch.utm_content,
          has_gclid: touch.gclid ? 1 : 0,
          has_fbclid: touch.fbclid ? 1 : 0,
          has_ttclid: touch.ttclid ? 1 : 0,
          click_id_type: id?.type,
          click_id: id?.value,
        };
        for (const k of Object.keys(params)) if (params[k] === undefined) delete params[k];
        window.gtag("event", "store_click", { ...params, transport_type: "beacon" });
      } catch {
        /* never block the click */
      }
    };
    document.addEventListener("click", onClick, true);
    return () => {
      mo.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  return null;
}
