"use client";

import Script from "next/script";
import { useEffect } from "react";
import type { Lang } from "@/dictionaries";

/**
 * NagishLi 3.0 beta accessibility widget, self-hosted in /public/nagishli: vendor file untouched, jQuery 3.7.1
 * self-hosted (no code.jquery.com request), plus /nagishli/site-patch.js (B21-B26 a11y fixes, statement link, L7/L8).
 *
 * NG-1: the widget reads its language once at start-up and then prefers the language it stored in localStorage,
 * so the loader overwrites the stored language with the page language before the vendor script runs. If a
 * client-side navigation ever crosses HE <-> EN after the widget started, sync and reload once.
 * The widget appends itself at the end of <body>; never move its DOM (it causes a large layout shift).
 */
const KEY = "Localize-NagishLi-A11y-Plugin-Settings-v3-Beta";

function syncStored(lang: string) {
  try {
    const st = JSON.parse(localStorage.getItem(KEY) || "null");
    if (st && st.language !== lang) {
      st.language = lang;
      localStorage.setItem(KEY, JSON.stringify(st));
    }
  } catch {
    /* storage blocked */
  }
}

export function NagishLi({ lang }: { lang: Lang }) {
  useEffect(() => {
    const started = (window as unknown as { nagishli_config?: { language?: string } }).nagishli_config?.language;
    if (!started || started === lang) return;
    syncStored(lang);
    window.location.reload();
  }, [lang]);

  return (
    <Script id="nagishli-loader" strategy="lazyOnload">
      {`(function(){var l=${JSON.stringify(lang)};try{var k="${KEY}",st=JSON.parse(localStorage.getItem(k)||"null");if(st&&st.language!==l){st.language=l;localStorage.setItem(k,JSON.stringify(st))}}catch(e){}window.nagishli_config={language:l,color:"purple"};
var q=["/nagishli/jquery.min.js","/nagishli/nagishli_beta.js?v=3.0b","/nagishli/site-patch.js"];(function n(){var u=q.shift();if(!u)return;var s=document.createElement("script");s.src=u;s.charset="utf-8";s.onload=n;document.body.appendChild(s)})();})();`}
    </Script>
  );
}
