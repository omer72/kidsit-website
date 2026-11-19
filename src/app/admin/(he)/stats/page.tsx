import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StatsPage } from "../../_stats/StatsPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "סטטיסטיקות · Kidsit", robots: { index: false, follow: false } };

// Hebrew (RTL) stats page. English lives at /admin/stats/en; ?lang=en is a shortcut to it.
export default function Page({ searchParams }: { searchParams: { e?: string; lang?: string } }) {
  if (searchParams.lang === "en") redirect("/admin/stats/en");
  return <StatsPage lang="he" searchParams={searchParams} />;
}
