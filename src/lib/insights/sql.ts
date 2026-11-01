import { SUBMISSION_COLUMNS } from "./constants";
import type { ValidatedInsight } from "./validate";

export const PURGE_FREE_TEXT_SQL = `
UPDATE insight_submissions
SET free_text = NULL
WHERE free_text IS NOT NULL
  AND free_text_expires_on IS NOT NULL
  AND free_text_expires_on <= CURRENT_DATE
RETURNING 1
`;

// One statement so the submission and its counts commit together. Identifiers
// are fixed; parent-supplied values stay in parameters.
export function buildInsertStatement(value: ValidatedInsight): { text: string; params: unknown[] } {
  const params: unknown[] = [
    value.schema_v,
    value.taxonomy_v,
    value.period,
    value.period_key,
    value.lang,
    value.platform,
    value.app_version,
    value.rating,
    value.free_text,
    value.free_text_expires_on,
  ];

  const tuples: string[] = [];
  for (const situation of value.situations) {
    const base = params.length;
    params.push(situation.type, situation.great, situation.better, situation.same, situation.worse, situation.unrated);
    tuples.push(
      `('situation', $${base + 1}, $${base + 2}::smallint, $${base + 3}::smallint, $${base + 4}::smallint, $${base + 5}::smallint, $${base + 6}::smallint, NULL::smallint, NULL::smallint)`,
    );
  }
  for (const move of value.moves) {
    const base = params.length;
    params.push(move.move, move.worked, move.not_worked);
    tuples.push(
      `('move', $${base + 1}, NULL::smallint, NULL::smallint, NULL::smallint, NULL::smallint, NULL::smallint, $${base + 2}::smallint, $${base + 3}::smallint)`,
    );
  }

  const countSelect =
    tuples.length === 0
      ? `SELECT sub.id, NULL::text, NULL::text, NULL::smallint, NULL::smallint, NULL::smallint, NULL::smallint, NULL::smallint, NULL::smallint, NULL::smallint
         FROM sub
         WHERE false`
      : `SELECT sub.id, v.kind, v.key, v.great, v.better, v.same, v.worse, v.unrated, v.worked, v.not_worked
         FROM sub
         CROSS JOIN (VALUES ${tuples.join(", ")}) AS v(kind, key, great, better, same, worse, unrated, worked, not_worked)`;

  const text = `
WITH sub AS (
  INSERT INTO insight_submissions (${SUBMISSION_COLUMNS.join(", ")})
  VALUES ($1::smallint, $2::smallint, $3, $4, $5, $6, $7, $8::smallint, $9, $10::date)
  RETURNING id
),
ins AS (
  INSERT INTO insight_counts (
    submission_id, kind, key, great, better, same, worse, unrated, worked, not_worked
  )
  ${countSelect}
  RETURNING 1
)
SELECT sub.id, (SELECT count(*) FROM ins) AS count_rows FROM sub
`;
  return { text, params };
}
