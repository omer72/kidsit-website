import { formatPostDate } from "@/lib/blog";
import { listApproved } from "@/lib/comments/db";

// Approved comments for one post, read by the static post page in the browser. Approving a comment shows up
// here within the CDN cache window below, without rebuilding the page.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang");
  const slug = searchParams.get("slug") ?? "";
  if ((lang !== "he" && lang !== "en") || !/^[a-z0-9-]{1,100}$/.test(slug)) {
    return Response.json({ error: "invalid_post" }, { status: 400 });
  }
  const comments = (await listApproved(lang, slug)).map((c) => ({
    id: c.id,
    name: c.name,
    body: c.body,
    iso: new Date(c.created_at).toISOString(),
    date: formatPostDate(new Date(c.created_at).toISOString().slice(0, 10), lang),
  }));
  return Response.json({ comments }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
