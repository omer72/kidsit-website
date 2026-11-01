import { bearerMatches } from "@/lib/insights/cron-auth";
import { insightsDatabaseUrl, purgeExpiredFreeText } from "@/lib/insights/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// Vercel Cron calls this daily (vercel.json). It only runs on production deployments.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (!secret) {
    return json(
      {
        ok: false,
        error: "cron_unconfigured",
        message:
          "Set CRON_SECRET on the Vercel project kidsit-ai. Vercel Cron sends it as Authorization: Bearer <CRON_SECRET>.",
      },
      503,
    );
  }
  if (!bearerMatches(req.headers.get("authorization"), secret)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!insightsDatabaseUrl()) {
    return json(
      {
        ok: false,
        error: "insights_storage_unconfigured",
        message: "Provision Neon Postgres for the Vercel project kidsit-ai and set DATABASE_URL before the purge can run.",
      },
      503,
    );
  }
  try {
    const purged = await purgeExpiredFreeText();
    return json({ ok: true, purged }, 200);
  } catch {
    console.error("insight purge failed");
    return json({ ok: false, error: "storage_failed" }, 500);
  }
}
