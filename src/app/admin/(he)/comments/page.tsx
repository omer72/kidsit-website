import type { Metadata } from "next";
import { cookies } from "next/headers";
import { configuredSecret, SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import { listAll, type AdminComment } from "@/lib/comments/db";
import { insightsDatabaseUrl } from "@/lib/insights/db";
import { login } from "../../_stats/actions";
import { approve, remove } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "תגובות · Kidsit", robots: { index: false, follow: false } };

// Moderation for blog comments. Same password and session cookie as /admin/stats (the cookie covers all of /admin).
const card = "min-w-0 rounded-2xl border-2 border-ink bg-white p-4 shadow-sticker-sm";
const button = "min-h-[44px] rounded-full border-2 border-ink px-5 py-2 text-sm font-bold shadow-sticker-sm";
const fmt = (d: string) => new Date(d).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" });

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-semibold">תגובות לבלוג</h1>
        <a href="/admin/stats" className="inline-flex min-h-[44px] items-center font-bold text-grape hover:underline">
          לסטטיסטיקות
        </a>
      </div>
      {children}
    </main>
  );
}

function Comment({ c }: { c: AdminComment }) {
  const path = `/${c.lang}/blog/${c.slug}`;
  return (
    <li className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold">
          <bdi>{c.name}</bdi>
          {c.status === "pending" ? <span className="ms-2 rounded-full bg-sunny px-2 text-xs">ממתינה</span> : null}
        </p>
        <p className="text-sm text-ink-muted tabular-nums">{fmt(c.created_at)}</p>
      </div>
      <p className="text-sm">
        <a href={path} dir="ltr" className="text-grape hover:underline">
          {path}
        </a>
      </p>
      {c.email ? (
        <p className="text-sm text-ink-muted" dir="ltr">
          {c.email}
        </p>
      ) : null}
      <p dir="auto" className="mt-2 whitespace-pre-line break-words">
        {c.body}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {c.status === "pending" ? (
          <form action={approve}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className={`${button} bg-grape text-white`}>
              אישור
            </button>
          </form>
        ) : null}
        <form action={remove}>
          <input type="hidden" name="id" value={c.id} />
          <button type="submit" className={`${button} bg-white`}>
            מחיקה
          </button>
        </form>
      </div>
    </li>
  );
}

export default async function Page({ searchParams }: { searchParams: { e?: string } }) {
  const secret = configuredSecret(process.env.STATS_PASSWORD);
  if (!secret)
    return (
      <Shell>
        <p className={card}>
          הדף נפתח רק כשמוגדר <code dir="ltr">STATS_PASSWORD</code> בסביבה הזו.
        </p>
      </Shell>
    );

  if (!verifySessionToken(cookies().get(SESSION_COOKIE)?.value, secret))
    return (
      <Shell>
        <form action={login} className={`${card} max-w-sm space-y-3`}>
          <input type="hidden" name="lang" value="he" />
          <input type="hidden" name="next" value="/admin/comments" />
          <label htmlFor="password" className="block font-bold">
            סיסמה
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2"
          />
          {searchParams.e ? (
            <p role="status" className="rounded-lg border border-bubblegum bg-bubblegum/10 p-2 text-sm">
              סיסמה שגויה.
            </p>
          ) : null}
          <button type="submit" className={`${button} bg-grape text-white`}>
            כניסה
          </button>
        </form>
      </Shell>
    );

  if (!insightsDatabaseUrl())
    return (
      <Shell>
        <p className={card}>
          אין חיבור למסד הנתונים (<code dir="ltr">DATABASE_URL</code>).
        </p>
      </Shell>
    );

  let comments: AdminComment[];
  try {
    comments = await listAll();
  } catch {
    console.error("blog comments admin read failed");
    return (
      <Shell>
        <p className={card}>
          טעינת התגובות נכשלה. אם זו הפעם הראשונה, צריך להריץ את <code dir="ltr">db/migrations/004_blog_comments.sql</code>.
        </p>
      </Shell>
    );
  }

  const pending = comments.filter((c) => c.status === "pending").length;
  return (
    <Shell>
      <p>
        {pending} ממתינות לאישור · {comments.length - pending} מאושרות
      </p>
      {comments.length ? (
        <ul className="space-y-3">
          {comments.map((c) => (
            <Comment key={c.id} c={c} />
          ))}
        </ul>
      ) : (
        <p className="text-ink-muted">עוד אין תגובות.</p>
      )}
    </Shell>
  );
}
