# Blog comments

Every blog post ends with a comment form. Name and comment are required; email and phone are optional. Only the name and the comment are ever shown publicly. A new comment is stored as `pending` in `blog_comments` and appears on the post after it is approved at **/admin/comments**, which uses the same `STATS_PASSWORD` and session as /admin/stats.

Post pages stay static. The comment list is loaded in the browser from `GET /api/comments?lang=…&slug=…`, which the CDN caches for 60 seconds, so an approved comment shows up within about a minute without a rebuild.

## Setup (once)

```bash
psql "$DATABASE_URL" -f db/migrations/004_blog_comments.sql
```

Until the table exists, posts show no comments, the form shows "sending failed", and /admin/comments asks for the migration.

## Spam

The form has a honeypot field, and there is no rate limit in code. If spam gets through, add a firewall rule on **kidsit-ai** shaped like the insights one in `docs/insights-operations.md`, e.g. 5 POSTs per hour per IP on paths starting with `/he/blog/` or `/en/blog/` (server actions POST to the page URL). It is not published here.
