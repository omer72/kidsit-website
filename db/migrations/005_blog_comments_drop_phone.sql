-- The reader comment form no longer collects a phone number (unnecessary PII / spam vector).
-- Apply once to the Neon database attached to the Vercel project kidsit-ai:
--   psql "$DATABASE_URL" -f db/migrations/005_blog_comments_drop_phone.sql

ALTER TABLE blog_comments DROP COLUMN IF EXISTS phone;
