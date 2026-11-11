import { readLimitedBody } from "@/lib/insights/body";
import { insightCorsHeaders, isAllowedInsightOrigin } from "@/lib/insights/cors";
import { insightsDatabaseUrl } from "@/lib/insights/db";
import { FUNNEL_BODY_MAX_BYTES } from "@/lib/funnel/constants";
import { recordFunnelStep } from "@/lib/funnel/db";
import { validateFunnelEvent } from "@/lib/funnel/validate";

// Anonymous funnel counts from the app: one POST per funnel step, once per install. The body has no
// identifier and the handler stores none; it only increments a counter (db/migrations/002_funnel_counts.sql).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const body = await readLimitedBody(req, FUNNEL_BODY_MAX_BYTES);
  if (!body.ok) return json({ ok: false, error: "payload_too_large" }, 413, headers);

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.text);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400, headers);
  }

  const result = validateFunnelEvent(parsed);
  if (!result.ok) return json({ ok: false, error: "invalid_payload", issues: result.issues }, 400, headers);

  // 503 so the app keeps the step and retries once storage exists.
  if (!insightsDatabaseUrl()) return json({ ok: false, error: "funnel_storage_unconfigured" }, 503, headers);

  try {
    await recordFunnelStep(result.value);
  } catch {
    // Do not log the payload, the IP, or the database error text.
    console.error("funnel upsert failed");
    return json({ ok: false, error: "storage_failed" }, 500, headers);
  }

  return json({ ok: true }, 201, headers);
}
