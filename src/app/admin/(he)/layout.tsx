import type { Metadata, Viewport } from "next";
import { colors } from "@/colors";
import "../../globals.css";
import { AdminRoot } from "../_stats/AdminRoot";

// Root layout for the private admin area (Hebrew, RTL). The English twin is (en)/layout.tsx.
export const metadata: Metadata = {
  title: "Kidsit · ניהול",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { themeColor: colors.paper };

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminRoot lang="he">{children}</AdminRoot>;
}
