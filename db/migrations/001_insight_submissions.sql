-- Anonymous insight submissions for POST /api/insights.
-- No IP address, user id, device id, user agent, or precise created_at.
-- The primary key is a random UUID. period_key is an ISO week (YYYY-Www) even for a daily digest.
-- free_text is cleared by /api/insights/purge (Vercel Cron) or by the job at the bottom of this file.
-- Apply once to the Neon database attached to the Vercel project kidsit-ai:
--   psql "$DATABASE_URL" -f db/migrations/001_insight_submissions.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS insight_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_v smallint NOT NULL,
  taxonomy_v smallint NOT NULL,
  period text NOT NULL CHECK (period IN ('day', 'week')),
  period_key text NOT NULL CHECK (period_key ~ '^[0-9]{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$'),
  lang text CHECK (lang IN ('he', 'en', 'es')),
  platform text CHECK (platform IN ('ios', 'android')),
  app_version text,
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  free_text text,
  free_text_expires_on date
);

CREATE TABLE IF NOT EXISTS insight_counts (
  submission_id uuid NOT NULL REFERENCES insight_submissions (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('situation', 'move')),
  key text NOT NULL,
  great smallint CHECK (great BETWEEN 0 AND 30),
  better smallint CHECK (better BETWEEN 0 AND 30),
  same smallint CHECK (same BETWEEN 0 AND 30),
  worse smallint CHECK (worse BETWEEN 0 AND 30),
  unrated smallint CHECK (unrated BETWEEN 0 AND 30),
  worked smallint CHECK (worked BETWEEN 0 AND 30),
  not_worked smallint CHECK (not_worked BETWEEN 0 AND 30),
  PRIMARY KEY (submission_id, kind, key),
  CHECK (
    (
      kind = 'situation'
      AND key IN (
        'transitions', 'bedtime_sleep', 'screens', 'homework_tasks', 'limits_cooperation',
        'tantrum_anger', 'siblings', 'social_friends', 'fears_anxiety', 'eating', 'other'
      )
      AND great IS NOT NULL AND better IS NOT NULL AND same IS NOT NULL AND worse IS NOT NULL AND unrated IS NOT NULL
      AND worked IS NULL AND not_worked IS NULL
    )
    OR (
      kind = 'move'
      AND key IN (
        'acknowledge', 'name_feeling', 'fantasy', 'choice', 'describe', 'give_info', 'one_word',
        'own_feeling', 'note', 'amends', 'problem_solving', 'hint', 'overhear', 'co_regulate', 'connect', 'other'
      )
      AND worked IS NOT NULL AND not_worked IS NOT NULL
      AND great IS NULL AND better IS NULL AND same IS NULL AND worse IS NULL AND unrated IS NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS insight_submissions_expires_idx
  ON insight_submissions (free_text_expires_on)
  WHERE free_text IS NOT NULL;

-- Manual equivalent of the daily purge, if Cron is not available.
-- Counts are kept. Only free text is removed, once free_text_expires_on has passed.
-- UPDATE insight_submissions
-- SET free_text = NULL
-- WHERE free_text IS NOT NULL
--   AND free_text_expires_on IS NOT NULL
--   AND free_text_expires_on <= CURRENT_DATE;
