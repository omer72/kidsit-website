import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { NagishLi } from "@/components/nagishli";
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
      </head>
      <body
        className={`${fontClass} bg-paper font-body text-ink antialiased`}
        style={{ "--font-body": he ? "var(--font-rubik)" : "var(--font-nunito)" } as React.CSSProperties}
      >
        {children}
        <NagishLi lang={params.lang} />
        {/* lazyOnload so analytics never competes with LCP or hydration */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MJH3YYBHJ0"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-MJH3YYBHJ0');`}
        </Script>
      </body>
    </html>
  );
}
