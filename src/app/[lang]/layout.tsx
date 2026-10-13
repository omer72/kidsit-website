import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { dictionaries, LANGS, type Lang } from "@/dictionaries";
import "../globals.css";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
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
    openGraph: {
      type: "website",
      siteName: "Kidsit AI",
      url: `/${params.lang}`,
      locale: params.lang === "he" ? "he_IL" : "en_US",
      title: t.title,
      description: t.description,
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
    },
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
