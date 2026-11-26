# Blog comments

Every blog post ends with a comment form. Name is required; email is optional. The form does not collect a phone number. Only the name, the date and the comment are ever shown publicly. A new comment is stored as `pending` in `blog_comments` and appears on the post after it is approved at **/admin/comments**, which uses the same `STATS_PASSWORD` and session as /admin/stats.

Post pages stay static. The comment list is loaded in the browser from `GET /api/comments?lang=…&slug=…`, which is not cached, so approving or deleting a comment shows on the post at once, without a rebuild.

## Setup (once)

```bash
psql "$DATABASE_URL" -f db/migrations/004_blog_comments.sql
psql "$DATABASE_URL" -f db/migrations/005_blog_comments_drop_phone.sql
```

Until the table exists, posts show no comments, the form shows "sending failed", and /admin/comments asks for the migration. If 004 ran but 005 has not, the `phone` column may still exist; the app no longer writes it.

## Spam

The form has a honeypot field (`confirm_url`), enforced on the server. Submissions are also capped in code at 5 posts per hour per hashed IP (in-process; on Vercel each instance has its own counter). If spam still gets through, add a firewall rule on **kidsit-ai** shaped like the insights one in `docs/insights-operations.md`, e.g. 5 POSTs per hour per IP on paths starting with `/he/blog/` or `/en/blog/` (server actions POST to the page URL). It is not published here.

## Privacy

The form includes a short notice, in Hebrew and English, that links to the comments section of the privacy policy (`/{lang}/privacy#comments`). The policy describes what is collected (name and optional email; no phone), that email is never shown on the site, that comments are moderated, and how to request deletion.
