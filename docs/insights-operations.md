# Anonymous insights operations

`POST /api/insights` on the Vercel project **kidsit-ai** (kidsit.ai) stores optional anonymous digest summaries. Do not configure this on the unused project `kidsit-website`.

This change does not provision a database, set environment variables, or publish firewall rules.

## What to provision

The project currently has no environment variables and no Neon database. Until both items below exist, `POST /api/insights` returns **503** `insights_storage_unconfigured` for a valid body, and `GET /api/insights/purge` returns **503** `cron_unconfigured` until `CRON_SECRET` is set.

1. In the Vercel dashboard, open project **kidsit-ai** (team `omer72s-projects`) and add **Neon Postgres** from the Vercel Marketplace. Accept the integration so it writes `DATABASE_URL` (and the related Neon URLs) onto that project for Production and Preview. Do not create a store on `kidsit-website`.
2. Apply the schema once:

   ```bash
   psql "$DATABASE_URL" -f db/migrations/001_insight_submissions.sql
   ```

3. Set `CRON_SECRET` on **kidsit-ai** (Production and Preview) to a long random value. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` to `GET /api/insights/purge`. The route rejects a missing or wrong secret. Cron schedules in `vercel.json` run on production deployments only.

Nothing in this repository buys or creates that database.

## What is stored

`insight_submissions` and `insight_counts` (see the migration). The primary key is `gen_random_uuid()`. The only time column is `free_text_expires_on`, set to the Sunday of the UTC week the request arrives, plus 90 days, so the row does not record the weekday. `period_key` is always an ISO week (`2026-W44`), including when `period` is `day`. Counts are integers from 0 to 30. Free text is capped at 500 characters and scrubbed for emails, phone numbers, URLs, 9-digit ID numbers, and full dates before insert. The handler does not log the body or the IP.

`same` is stored as its own count. The digest copy on the device treats “about the same” as not having worked; that wording is not applied by collapsing the stored number.

## 90-day free-text purge

`vercel.json` schedules `GET /api/insights/purge` every day at 03:15 UTC. The route sets `free_text` to null where `free_text_expires_on` is on or before the current date. Counts stay.

The same statement is commented at the bottom of `db/migrations/001_insight_submissions.sql` for a manual `psql` job.

## Firewall rate limit (not applied)

Do **not** publish this rule as part of deploying the branch. `vercel firewall publish` updates the live firewall for the linked project. This PR only documents the rule. Add it later, by hand, on **kidsit-ai** only.

Vercel still writes the client IP into its own request logs. The rule is what keeps that IP out of Neon: the limit is enforced at the edge, and the route never inserts the IP.

Suggested rule, matching the spec (5 POSTs per hour per IP). OPTIONS is excluded so a preflight does not use the budget. The purge path is a different path and is authenticated with `CRON_SECRET`.

Dashboard: project **kidsit-ai** → Firewall → Add rule.

- Name: `Rate limit anonymous insights`
- Condition (AND): request path equals `/api/insights`, request method equals `POST`
- Action: rate limit
- Window: 3600 seconds
- Max requests: 5
- Key: IP
- When exceeded: deny

CLI equivalent, after `vercel link` to project `kidsit-ai` (scope `omer72s-projects`). This stages a draft. It does not affect traffic until someone publishes it. Do not publish it from this change, and do not link the CLI to `kidsit-website`.

```bash
vercel firewall rules add "Rate limit anonymous insights" \
  --scope omer72s-projects \
  --condition '{"type":"path","op":"eq","value":"/api/insights"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit \
  --rate-limit-window 3600 \
  --rate-limit-requests 5 \
  --rate-limit-keys ip \
  --rate-limit-action deny \
  --description "5 POSTs per hour per IP. The IP is not written to Neon."
```

Review the draft with `vercel firewall diff`. Leave it unpublished until you intend the production project to enforce it.
