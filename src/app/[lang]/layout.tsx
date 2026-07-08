import type { Metadata } from "next";
import Script from "next/script";
import { Fredoka, Nunito, Rubik } from "next/font/google";
import { dictionaries, LANGS, type Lang } from "@/dictionaries";
import "../globals.css";

const fredoka = Fredoka({
  subsets: ["latin", "hebrew"],
  variable: "--font-fredoka",
  weight: ["500", "600"],
});
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "700", "800"],
});
const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  weight: ["400", "700", "800"],
});

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { lang: Lang } }): Metadata {
  const t = dictionaries[params.lang].meta;
  return {
    title: t.title,
    description: t.description,
    alternates: {
      languages: { en: "/en", he: "/he" },
    },
  };
}

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Lang };
}>) {
  const t = dictionaries[params.lang];
  const bodyFont =
    params.lang === "he" ? "var(--font-rubik)" : "var(--font-nunito)";
  return (
    <html lang={params.lang} dir={t.dir} className="scroll-smooth">
      <body
        className={`${fredoka.variable} ${nunito.variable} ${rubik.variable} bg-paper font-body text-ink antialiased`}
        style={{ "--font-body": bodyFont } as React.CSSProperties}
      >
        {children}
        {/* afterInteractive so analytics never competes with LCP */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MJH3YYBHJ0"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-MJH3YYBHJ0');`}
        </Script>
      </body>
    </html>
  );
}
