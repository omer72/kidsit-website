import { neon } from "@neondatabase/serverless";
import { buildInsertStatement, PURGE_FREE_TEXT_SQL } from "./sql";
import type { ValidatedInsight } from "./validate";

export function insightsDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  return url ? url : null;
}

export async function insertInsight(value: ValidatedInsight): Promise<void> {
  const url = insightsDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = neon(url);
  const statement = buildInsertStatement(value);
  await sql.query(statement.text, statement.params);
}

export async function purgeExpiredFreeText(): Promise<number> {
  const url = insightsDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = neon(url);
  const rows = await sql.query(PURGE_FREE_TEXT_SQL);
  return rows.length;
}
