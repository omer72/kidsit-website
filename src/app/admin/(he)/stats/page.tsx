import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { englishRedirectTarget } from "@/lib/admin/lang";
import { StatsPage } from "../../_stats/StatsPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "סטטיסטיקות · Kidsit", robots: { index: false, follow: false } };

// Hebrew (RTL) stats page. English lives at /admin/stats/en; ?lang=en is a shortcut to it (other query params are kept).
export default function Page({ searchParams }: { searchParams: { e?: string; lang?: string | string[] } & Record<string, string | string[] | undefined> }) {
  const en = englishRedirectTarget(searchParams);
  if (en) redirect(en);
  return <StatsPage lang="he" searchParams={{ e: typeof searchParams.e === "string" ? searchParams.e : undefined }} />;
}
