-- Funnel: full app version (major.minor.patch) and the paywall entry point.
-- Additive and backward compatible: the old '1.0' form still passes, and the code that is live today
-- (which only writes funnel_counts) keeps working before and after this migration. No existing row changes.
--
--   1. funnel_counts.app_version: the CHECK now also accepts major.minor.patch (for example '1.0.14').
--      The old CHECK is replaced by a wider one; the primary key and every existing row are untouched.
--   2. funnel_entry_counts (new): one counter per (UTC day, platform, app version, entry) for the
--      paywall_shown step only. entry is which screen opened the paywall. Same rules as funnel_counts:
--      no row per request and no IP address, user id, device id, user agent, or timestamp.
--
-- Run this on the Neon database BEFORE the site code that accepts '1.0.14' and `entry` is deployed.
-- Apply once to the Neon database attached to the Vercel project kidsit-ai:
--   psql "$DATABASE_URL" -f db/migrations/003_funnel_app_version_entry.sql
-- Safe to run twice.

BEGIN;

-- Drop whatever CHECK on funnel_counts mentions app_version (the auto name is funnel_counts_app_version_check),
-- then add the wider one under a fixed name.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'funnel_counts'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%app_version%'
  LOOP
    EXECUTE format('ALTER TABLE funnel_counts DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE funnel_counts
  ADD CONSTRAINT funnel_counts_app_version_check
  CHECK (app_version ~ '^([0-9]{1,3}\.[0-9]{1,3}(\.[0-9]{1,3})?)?$');

CREATE TABLE IF NOT EXISTS funnel_entry_counts (
  day date NOT NULL,
  platform text NOT NULL DEFAULT '' CHECK (platform IN ('', 'ios', 'android')),
  app_version text NOT NULL DEFAULT '' CHECK (app_version ~ '^([0-9]{1,3}\.[0-9]{1,3}(\.[0-9]{1,3})?)?$'),
  entry text NOT NULL CHECK (entry IN ('first_moment', 'free_limit', 'add_child', 'settings')),
  n integer NOT NULL DEFAULT 0 CHECK (n >= 0),
  PRIMARY KEY (day, platform, app_version, entry)
);

CREATE INDEX IF NOT EXISTS funnel_entry_counts_day_idx ON funnel_entry_counts (day);

COMMIT;
