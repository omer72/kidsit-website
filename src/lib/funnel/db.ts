import { neon } from "@neondatabase/serverless";
import { insightsDatabaseUrl } from "@/lib/insights/db";
import {
  FUNNEL_ENTRY_SUMMARY_SQL,
  FUNNEL_SUMMARY_SQL,
  FUNNEL_UPSERT_SQL,
  FUNNEL_UPSERT_WITH_ENTRY_SQL,
  funnelUpsertParams,
  funnelUpsertWithEntryParams,
} from "./sql";
import type { ValidatedFunnelEvent } from "./validate";

export type FunnelRow = { step: string; platform: string; source: string; n: number };
export type FunnelEntryRow = { entry: string; platform: string; n: number };

export async function recordFunnelStep(value: ValidatedFunnelEvent): Promise<void> {
  const url = insightsDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL missing");
  if (value.entry) await neon(url).query(FUNNEL_UPSERT_WITH_ENTRY_SQL, funnelUpsertWithEntryParams(value));
  else await neon(url).query(FUNNEL_UPSERT_SQL, funnelUpsertParams(value));
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

/** Empty when 003_funnel_app_version_entry.sql has not been applied yet, so the dashboard still loads. */
export async function loadFunnelEntryRows(databaseUrl: string): Promise<FunnelEntryRow[]> {
  let rows: unknown;
  try {
    rows = await neon(databaseUrl).query(FUNNEL_ENTRY_SUMMARY_SQL);
  } catch (e) {
    if (e instanceof Error && /funnel_entry_counts/.test(e.message) && /does not exist/.test(e.message)) return [];
    throw e;
  }
  return (rows as Record<string, unknown>[]).map((r) => ({
    entry: String(r.entry ?? ""),
    platform: String(r.platform ?? ""),
    n: Number(r.n ?? 0),
  }));
}
