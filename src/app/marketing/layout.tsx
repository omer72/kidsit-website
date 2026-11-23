import type { Metadata, Viewport } from "next";
import { fontClass } from "./fonts";
import "../globals.css";
import "./marketing.css";

// Unlisted landing-page test: own root layout (English, LTR), noindex, not reachable from the
// main nav. Not locale-routed — see shouldBypassLocale in src/lib/locale-bypass.ts.
export const metadata: Metadata = {
  title: "kidsit.ai — The moment it happens",
  description: "Press one button. In under 10 seconds, get guidance that already knows your child.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { themeColor: "#0b0b10" };

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={fontClass}>
      <body className="bg-[#0b0b10] font-body text-[#f5f4f0] antialiased">{children}</body>
    </html>
  );
}
