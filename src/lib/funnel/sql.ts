import type { ValidatedFunnelEvent } from "./validate";

// The day is the server's UTC date. Nothing about the request itself is stored: the statement only
// bumps a counter.
export const FUNNEL_UPSERT_SQL = `
INSERT INTO funnel_counts (day, step, platform, lang, app_version, source, n)
VALUES ((now() AT TIME ZONE 'utc')::date, $1, $2, $3, $4, $5, 1)
ON CONFLICT (day, step, platform, lang, app_version, source)
DO UPDATE SET n = funnel_counts.n + 1
`;

export function funnelUpsertParams(value: ValidatedFunnelEvent): string[] {
  return [value.step, value.platform, value.lang, value.app_version, value.source];
}

// Last 28 UTC days including today.
export const FUNNEL_SUMMARY_SQL = `
SELECT step, platform, source, SUM(n)::int AS n
FROM funnel_counts
WHERE day >= (now() AT TIME ZONE 'utc')::date - 27
GROUP BY step, platform, source
`;
