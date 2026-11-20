# Opening the app from blog (and other) CTAs

Status of what the site does today, what the app claims, and what is still needed on iOS. Source of truth for the app side:
`omer72/kidsai-app` (1.0.18: `ios/App/App/App.entitlements`, `android/app/src/main/AndroidManifest.xml`, `src/appLinks.js`).

## What the app claims (verified in kidsai-app main, 1.0.18)
- iOS: bundle id `ai.kidsit.app`, team `ZZT9HHZQNA`, entitlement `applinks:kidsit.ai` only. No `CFBundleURLTypes`: **no custom URL scheme**.
- Android: package `ai.kidsit.app`, one `autoVerify` VIEW filter on `https://kidsit.ai` for `/he/blog/`, `/en/blog/` (prefix) and `/app` (exact). No custom scheme.
- App Store id `6769443099` (iTunes lookup: bundle `ai.kidsit.app`, version 1.0.18). `www.kidsit.ai` is not claimed (it 308-redirects, and Apple does not follow redirects for the AASA).
- The app parses `https://kidsit.ai/(he|en)/blog/<slug>` and `/app` plus `l`, `p`, `ct`, `utm_source|medium|campaign|content` and stores them as attribution. Any other host or path is ignored.

## Android (this PR)
Play buttons (in-post, inline, bottom bar, Android banner, markdown links) are plain Play links in the HTML. After hydration, on **Chrome, Chrome Custom Tabs, Edge and Samsung Internet** they become
`intent://kidsit.ai/app?l&p&ct&utm_*#Intent;scheme=https;package=ai.kidsit.app;S.browser_fallback_url=<Play link with referrer>;end`:
- app installed (1.0.18+): the app opens (cold launch → Home/compose) and gets the attribution in the URL;
- not installed, or an older app without the App Link filter: the browser follows `S.browser_fallback_url`, the normal Play link with the same `referrer`.
Not used (plain Play link as before): WebViews and in-app browsers (Facebook, Instagram, TikTok, Line, Telegram, X, LinkedIn, DuckDuckGo, Google app), Firefox, Opera, Android "desktop site" mode, and everything that is not Android.
The intent only fires from a user tap.

## iOS (this PR changes nothing on the buttons; why)
- A tap on a link to the **same host** stays in the browser; iOS opens an app only for a Universal Link tapped from a page on a *different* domain (or typed/scanned/from another app). A server redirect after a tap does not open the app either.
- So `kidsit.ai` page → `apps.apple.com` (App Store; an installed app shows "Open") is the best a same-site link can do, and `kidsit.ai/app` as a CTA target would not help.
- Safari Smart App Banner: home, blog index and every post carry exactly one `<meta name="apple-itunes-app" content="app-id=6769443099, app-argument=<the page's canonical URL>, affiliate-data=pt=…&ct=<page>-banner">` (page-level metadata replaces the layout fallback `app-id=6769443099`, which stays only on legal/about pages, so there is never a second tag; a test checks the built HTML). Installed → "Open" in Safari; not installed → "View" to the App Store with the banner ct. It shows only in iOS Safari, not in iOS Chrome or in-app browsers.
  - The app (`parseAppLink`) accepts `https://kidsit.ai/he|en/blog[/<slug>]` and `/app` and records page/lang; the home pages (`/he`, `/en`) are not claimed, so their app-argument just opens the app. `app-argument` carries no `ct`/`utm` (the page URL only); the install attribution for the banner path is `affiliate-data` (App Store Connect campaign), not the app's `ct`.
  - Whether "Open" delivers the argument as a Universal Link (`appUrlOpen`) or as a plain open-URL depends on iOS; the app handles both through Capacitor `appUrlOpen`/`getLaunchUrl`. Not verifiable on the box.
  - The site's own top install banner (`AndroidInstallBanner`) is Android-only, so on iOS there is never a second top banner. The fixed bottom bar (store badges, mobile only) is a different element and stays.
- `/app` already works as a Universal Link from other sources (QR scanned with the Camera, links in email/social/ads): installed → the app opens; otherwise the request reaches the server, which redirects to the App Store with `ct`.

### What an iOS "open if installed" button needs (app side, not done here)
Pick one cross-host hop that the app claims, e.g. `https://go.kidsit.ai` (new Vercel domain + DNS) or `https://www.kidsit.ai`:
1. `App.entitlements`: add `applinks:go.kidsit.ai` (keep `applinks:kidsit.ai`).
2. `src/appLinks.js`: `APP_LINK_HOST` must accept the new host (today only `kidsit.ai`); same parsing for `/app`.
3. New app build (iOS + the Android filter optional) and a device test: from a page on kidsit.ai in Safari and Chrome iOS, tap a link to `https://go.kidsit.ai/app?...` → app opens when installed.
4. Site (follow-up PR once 3 passes): serve the AASA on the new host with no redirect, point iOS CTAs at `https://go.kidsit.ai/app?l&p&ct`, keep the store redirect in `/app` as the not-installed fallback. If `www` is chosen instead, `next.config.mjs` must stop redirecting `/.well-known/*` on `www`.
Only users who have the updated build benefit; it needs a real-device check because a sub-domain hop within the same registrable domain is reported to work but is not guaranteed by Apple's docs.

## /app
`GET /app?l=he|en&p=<page token>` → 302 (no-store, `Vary: User-Agent`): iPhone/iPad → App Store (`pt`, `ct=<page>-qr`, `mt=8`), Android → Google Play (referrer with `utm_*`, content `qr`), anything else → `/<lang>` (or `/<lang>/blog` for `p=blog-index`).
Optional `ct` and `utm_source|medium|campaign|content` replace the defaults (cut to `[a-z0-9._-]`, `ct` ≤ 40), so a link from another site keeps its campaign. Destinations are fixed, so it is not an open redirect.
