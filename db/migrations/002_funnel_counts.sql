-- Anonymous funnel counters for POST /api/funnel.
-- One row per (UTC day, step, platform, language, major.minor version, install source), holding a count.
-- There is no row per request and no IP address, user id, device id, user agent, or timestamp.
-- '' means "not sent" for the optional dimensions, so they can be part of the primary key.
-- Apply once to the Neon database attached to the Vercel project kidsit-ai:
--   psql "$DATABASE_URL" -f db/migrations/002_funnel_counts.sql

CREATE TABLE IF NOT EXISTS funnel_counts (
  day date NOT NULL,
  step text NOT NULL CHECK (
    step IN (
      'onboarding_done', 'child_added', 'moment_sent', 'answer_received',
      'moment_rated', 'paywall_shown', 'paywall_dismissed', 'purchase'
    )
  ),
  platform text NOT NULL DEFAULT '' CHECK (platform IN ('', 'ios', 'android')),
  lang text NOT NULL DEFAULT '' CHECK (lang IN ('', 'he', 'en', 'es')),
  app_version text NOT NULL DEFAULT '' CHECK (app_version ~ '^([0-9]{1,3}\.[0-9]{1,3})?$'),
  source text NOT NULL DEFAULT '' CHECK (source ~ '^([a-z0-9][a-z0-9_.-]{0,39})?$'),
  n integer NOT NULL DEFAULT 0 CHECK (n >= 0),
  PRIMARY KEY (day, step, platform, lang, app_version, source)
);

CREATE INDEX IF NOT EXISTS funnel_counts_day_idx ON funnel_counts (day);
