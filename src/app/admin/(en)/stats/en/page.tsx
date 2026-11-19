import type { Metadata } from "next";
import { StatsPage } from "../../../_stats/StatsPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stats · Kidsit", robots: { index: false, follow: false } };

// English (LTR) stats page: same password gate, data and components as /admin/stats.
export default function Page({ searchParams }: { searchParams: { e?: string } }) {
  return <StatsPage lang="en" searchParams={searchParams} />;
}
