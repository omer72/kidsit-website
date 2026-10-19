import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { NagishLi } from "@/components/nagishli";
import { CookieConsent } from "@/components/cookie-consent";
import { Analytics } from "@/components/analytics";
import { ogFor } from "@/lib/seo";
import { dictionaries, LANGS, type Lang } from "@/dictionaries";
import "../globals.css";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

// No `dynamicParams = false` here: it would also apply to [...missing] and turn every unknown /he/... or /en/... URL
// into Next's bare global 404. The middleware only lets /he/... and /en/... reach this layout; the guard below is a backstop.
const isLang = (l: string): l is Lang => (LANGS as readonly string[]).includes(l);

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  if (!isLang(params.lang)) notFound();
  const t = dictionaries[params.lang].meta;
  return {
    metadataBase: new URL("https://kidsit.ai"),
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `/${params.lang}`,
      languages: { en: "/en", he: "/he", "x-default": "/en" },
    },
    other: { "apple-itunes-app": "app-id=6769443099" },
    ...ogFor(params.lang, t.title, t.description, ""),
  };
}

export const viewport: Viewport = { themeColor: "#F3F6FF" };

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Lang };
}>) {
  if (!isLang(params.lang)) notFound();
  const t = dictionaries[params.lang];
  const he = params.lang === "he";
  // Separate modules so /en never preloads Hebrew font files (and /he never Nunito).
  const fontClass = (he ? await import("./fonts-he") : await import("./fonts-en")).fontClass;
  return (
    // suppressHydrationWarning: the inline script below adds "js" before React hydrates
    <html lang={params.lang} dir={t.dir} className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        {/* Consent Mode v2 defaults denied before any Google tag; gtag.js loads only after accept (see Analytics). */}
        <Script id="consent-defaults" strategy="beforeInteractive">{`(function(){window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:500});})();`}</Script>
        {/* Show the prerendered consent banner from first paint when no valid choice is stored (v1, 12 months). */}
        <Script id="consent-needed" strategy="beforeInteractive">{`try{var c=JSON.parse(localStorage.getItem('kidsit-consent')||'null');if(!c||c.v!==1||!c.ts||Date.now()-Date.parse(c.ts)>31536e6)document.documentElement.classList.add('consent-needed')}catch(e){document.documentElement.classList.add('consent-needed')}`}</Script>
      </head>
      <body
        className={`${fontClass} bg-paper font-body text-ink antialiased`}
        style={{ "--font-body": he ? "var(--font-rubik)" : "var(--font-nunito)" } as React.CSSProperties}
      >
        {children}
        <NagishLi lang={params.lang} />
        <CookieConsent lang={params.lang} />
        <Analytics />
      </body>
    </html>
  );
}
