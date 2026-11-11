import { neon } from "@neondatabase/serverless";
import { insightsDatabaseUrl } from "@/lib/insights/db";
import { FUNNEL_SUMMARY_SQL, FUNNEL_UPSERT_SQL, funnelUpsertParams } from "./sql";
import type { ValidatedFunnelEvent } from "./validate";

export type FunnelRow = { step: string; platform: string; source: string; n: number };

export async function recordFunnelStep(value: ValidatedFunnelEvent): Promise<void> {
  const url = insightsDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL missing");
  await neon(url).query(FUNNEL_UPSERT_SQL, funnelUpsertParams(value));
}

export async function loadFunnelRows(databaseUrl: string): Promise<FunnelRow[]> {
  const rows = await neon(databaseUrl).query(FUNNEL_SUMMARY_SQL);
  return (rows as Record<string, unknown>[]).map((r) => ({
    step: String(r.step ?? ""),
    platform: String(r.platform ?? ""),
    source: String(r.source ?? ""),
    n: Number(r.n ?? 0),
  }));
}
