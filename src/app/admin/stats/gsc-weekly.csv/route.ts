import { NextResponse, type NextRequest } from "next/server";
import { exportAllowed } from "@/lib/admin/export-auth";
import { loadGscWeekly, weeklyCsv } from "@/lib/admin/gsc";
import { safeErrorMessage } from "@/lib/admin/providers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRIVATE = { "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "private, no-store" };
const text = (status: number, body: string) =>
  new NextResponse(body, { status, headers: { ...PRIVATE, "Content-Type": "text/plain; charset=utf-8" } });

// GET /admin/stats/gsc-weekly.csv: query+page rows, last 7 days vs the 7 before (finalized GSC data, 3-day lag).
export async function GET(req: NextRequest) {
  const allowed = exportAllowed(
    { cookie: (n) => req.cookies.get(n)?.value, header: (n) => req.headers.get(n) },
    process.env,
  );
  if (!allowed) return text(401, "Unauthorized. Log in at /admin/stats first.");
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || !process.env.GSC_SITE_URL?.trim())
    return text(503, "Search Console is not connected (GOOGLE_SERVICE_ACCOUNT_JSON / GSC_SITE_URL missing).");
  try {
    const w = await loadGscWeekly(process.env);
    return new NextResponse(weeklyCsv(w.rows), {
      status: 200,
      headers: {
        ...PRIVATE,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gsc-weekly-${w.lastWeek.startDate}_${w.lastWeek.endDate}.csv"`,
        "X-GSC-Last-Week": `${w.lastWeek.startDate}..${w.lastWeek.endDate}`,
        "X-GSC-Previous-Week": `${w.prevWeek.startDate}..${w.prevWeek.endDate}`,
      },
    });
  } catch (e) {
    return text(502, safeErrorMessage(e));
  }
}
