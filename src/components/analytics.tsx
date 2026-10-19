"use client";

import { useEffect } from "react";
import { loadAnalytics, readConsent } from "@/lib/consent";

/** Loads GA4 only when analytics consent is already stored or newly granted. */
export function Analytics() {
  useEffect(() => {
    if (readConsent()?.analytics) loadAnalytics();
    const on = (e: Event) => {
      const c = (e as CustomEvent).detail;
      if (c?.analytics) loadAnalytics();
    };
    addEventListener("kidsit-consent", on);
    return () => removeEventListener("kidsit-consent", on);
  }, []);
  return null;
}
