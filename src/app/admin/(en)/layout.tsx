import type { Metadata, Viewport } from "next";
import { colors } from "@/colors";
import "../../globals.css";
import { AdminRoot } from "../_stats/AdminRoot";

// Root layout for the English admin stats page (LTR). Same privacy rules as the Hebrew layout in (he)/layout.tsx.
export const metadata: Metadata = {
  title: "Kidsit · Admin",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { themeColor: colors.paper };

export default function AdminLayoutEn({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminRoot lang="en">{children}</AdminRoot>;
}
