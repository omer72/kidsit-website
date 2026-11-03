"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { readConsent } from "@/lib/consent";
import { hasMetaConsent, isMetaPixelLoaded, shouldTrackMetaRouteChange } from "@/lib/meta-pixel";

/**
 * PageView on client navigations. The head bootstrap already tracks the first load
 * (stored consent or a later accept), so that path is skipped. Later paths fire only
 * when analytics consent is on and fbevents.js is loaded — the pre-consent stub must
 * not be queued, or the hit would send when the library eventually arrives.
 */
export function MetaPixelPageView() {
  const pathname = usePathname();
  const seen = useRef<string | null>(null);

  useEffect(() => {
    const first = seen.current === null;
    const same = seen.current === pathname;
    const flag = window.__kidsitMetaGranted;
    const fbq = window.fbq;
    const track = shouldTrackMetaRouteChange({
      isFirstObservedPath: first,
      samePath: same,
      analyticsConsent: hasMetaConsent({
        grantedFlag: typeof flag === "boolean" ? flag : undefined,
        stored: readConsent(),
      }),
      pixelLoaded: isMetaPixelLoaded(fbq),
    });
    seen.current = pathname;
    if (track && isMetaPixelLoaded(fbq)) fbq("track", "PageView");
  }, [pathname]);

  return null;
}
