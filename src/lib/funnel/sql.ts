import type { ValidatedFunnelEvent } from "./validate";

// The day is the server's UTC date. Nothing about the request itself is stored: the statement only
// bumps a counter.
export const FUNNEL_UPSERT_SQL = `
INSERT INTO funnel_counts (day, step, platform, lang, app_version, source, n)
VALUES ((now() AT TIME ZONE 'utc')::date, $1, $2, $3, $4, $5, 1)
ON CONFLICT (day, step, platform, lang, app_version, source)
DO UPDATE SET n = funnel_counts.n + 1
`;

// paywall_shown with an `entry`: the same counter bump plus one bump in funnel_entry_counts, in one
// statement so both happen or neither does. Still no request data, only server-side day and counters.
export const FUNNEL_UPSERT_WITH_ENTRY_SQL = `
WITH bump AS (
  INSERT INTO funnel_counts (day, step, platform, lang, app_version, source, n)
  VALUES ((now() AT TIME ZONE 'utc')::date, $1, $2, $3, $4, $5, 1)
  ON CONFLICT (day, step, platform, lang, app_version, source)
  DO UPDATE SET n = funnel_counts.n + 1
)
INSERT INTO funnel_entry_counts (day, platform, app_version, entry, n)
VALUES ((now() AT TIME ZONE 'utc')::date, $2, $4, $6, 1)
ON CONFLICT (day, platform, app_version, entry)
DO UPDATE SET n = funnel_entry_counts.n + 1
`;

export function funnelUpsertParams(value: ValidatedFunnelEvent): string[] {
  return [value.step, value.platform, value.lang, value.app_version, value.source];
}

export function funnelUpsertWithEntryParams(value: ValidatedFunnelEvent): string[] {
  return [...funnelUpsertParams(value), value.entry];
}

// Last 28 UTC days including today.
export const FUNNEL_SUMMARY_SQL = `
SELECT step, platform, source, SUM(n)::int AS n
FROM funnel_counts
WHERE day >= (now() AT TIME ZONE 'utc')::date - 27
GROUP BY step, platform, source
`;

// Same 28 days, for the paywall entry table on /admin/stats.
export const FUNNEL_ENTRY_SUMMARY_SQL = `
SELECT entry, platform, SUM(n)::int AS n
FROM funnel_entry_counts
WHERE day >= (now() AT TIME ZONE 'utc')::date - 27
GROUP BY entry, platform
`;
