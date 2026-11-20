-- Reader comments on blog posts. A comment is stored as 'pending' and shows on the post only after an admin
-- approves it at /admin/comments. Only name and body are ever displayed; email and phone are optional and admin-only.
-- Apply once to the Neon database attached to the Vercel project kidsit-ai:
--   psql "$DATABASE_URL" -f db/migrations/004_blog_comments.sql

CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang text NOT NULL CHECK (lang IN ('he', 'en')),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9-]{1,100}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  email text CHECK (char_length(email) <= 254),
  phone text CHECK (char_length(phone) <= 30),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_comments_post_idx ON blog_comments (lang, slug, status, created_at);
