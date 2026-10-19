"use client";

// Remember the choice for the middleware's bare-path redirects and keep the #section (section ids are the
// same in both languages).
export function rememberLocale(e: React.MouseEvent<HTMLAnchorElement>) {
  const a = e.currentTarget;
  document.cookie = `NEXT_LOCALE=${a.hreflang}; path=/; max-age=31536000; samesite=lax`;
  a.hash = window.location.hash;
}

export function LangSwitchLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} onClick={rememberLocale} />;
}
