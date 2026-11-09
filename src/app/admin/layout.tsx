import type { Metadata, Viewport } from "next";
import { fontClass } from "../[lang]/fonts-he";
import { colors } from "@/colors";
import "../globals.css";

// Separate root layout for the private admin area: Hebrew, RTL, no analytics, no consent banner, no Nagish.
export const metadata: Metadata = {
  title: "Kidsit · ניהול",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { themeColor: colors.paper };

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${fontClass} bg-paper font-body text-ink antialiased`}
        style={{ "--font-body": "var(--font-rubik)" } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
