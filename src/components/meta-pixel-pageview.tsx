"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Fbq = (...args: unknown[]) => void;

/**
 * Fires Meta Pixel PageView on App Router client navigations.
 * The inline snippet in <head> already tracks the first load, so the first render is skipped.
 */
export function MetaPixelPageView() {
  const pathname = usePathname();
  const seen = useRef<string | null>(null);

  useEffect(() => {
    // First observed path is the full page load, already tracked by the head snippet.
    if (seen.current === null) {
      seen.current = pathname;
      return;
    }
    if (seen.current === pathname) return;
    seen.current = pathname;
    const fbq = (window as Window & { fbq?: Fbq }).fbq;
    fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}
