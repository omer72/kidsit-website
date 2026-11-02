import { readLimitedBody } from "@/lib/insights/body";
import { insightCorsHeaders, isAllowedInsightOrigin } from "@/lib/insights/cors";
import { insertInsight, insightsDatabaseUrl } from "@/lib/insights/db";
import { validateInsight } from "@/lib/insights/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_MESSAGE =
  "Anonymous insights storage is not configured. Provision Neon Postgres for the Vercel project kidsit-ai, set DATABASE_URL, and apply db/migrations/001_insight_submissions.sql.";

function json(body: unknown, status: number, headers: Headers): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

export function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const headers = insightCorsHeaders(origin);
  if (origin && !isAllowedInsightOrigin(origin)) return new Response(null, { status: 403, headers });
  return new Response(null, { status: 204, headers });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const headers = insightCorsHeaders(origin);
  if (origin && !isAllowedInsightOrigin(origin)) {
    return json({ ok: false, error: "origin_not_allowed" }, 403, headers);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ ok: false, error: "unsupported_media_type" }, 415, headers);
  }

  const body = await readLimitedBody(req);
  if (!body.ok) return json({ ok: false, error: "payload_too_large" }, 413, headers);

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.text);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400, headers);
  }

  const result = validateInsight(parsed);
  if (!result.ok) return json({ ok: false, error: "invalid_payload", issues: result.issues }, 400, headers);

  if (!insightsDatabaseUrl()) {
    return json({ ok: false, error: "insights_storage_unconfigured", message: STORAGE_MESSAGE }, 503, headers);
  }

  try {
    await insertInsight(result.value);
  } catch {
    // Do not log the payload, the IP, or the database error text. Neon errors can echo parameters.
    console.error("insight insert failed");
    return json({ ok: false, error: "storage_failed" }, 500, headers);
  }

  return json({ ok: true }, 201, headers);
}
