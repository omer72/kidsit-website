import type { Metadata } from "next";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { configuredSecret, SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import { allSectionsFailed, loadRevenueCat, resolveConfig, type DailyPoint, type RevenueCatStats, type Section, type SegmentTotal } from "@/lib/admin/revenuecat";
import { loadMeta, metaAnyFailed, metaFingerprint, resolveMetaConfig, type MetaStats } from "@/lib/admin/meta";
import { EXTRA_PROVIDERS, providerById, runProvider, type ProviderData, type ProviderResult, type Table } from "@/lib/admin/providers";
import { login, logout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "סטטיסטיקות · Kidsit", robots: { index: false, follow: false } };

const CACHE_S = 900; // 15 minutes

// Cached 15 min per project id and key fingerprint (so a new or rotated key shows up at once). The key itself is
// read inside and never becomes part of the cache key. Results where every call failed are not cached.
class AllFailed extends Error {
  constructor(public result: RevenueCatStats) {
    super("all RevenueCat calls failed");
  }
}
const cachedRevenueCat = unstable_cache(
  // keyFingerprint is unused in the body on purpose: unstable_cache folds the arguments into the cache key.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (projectId: string, keyFingerprint: string): Promise<RevenueCatStats> => {
    const r = await loadRevenueCat({ ...process.env, REVENUECAT_PROJECT_ID: projectId });
    if (r.state === "ok" && allSectionsFailed(r)) throw new AllFailed(r);
    return r;
  },
  ["admin-stats-revenuecat-v1"],
  { revalidate: CACHE_S },
);

// Google sections: same rules as RevenueCat. 15 min cache keyed on the provider and a fingerprint of its env
// (service-account JSON + property/site), so a new or rotated key shows up at once. A thrown error is never cached.
const cachedProviderData = unstable_cache(
  // envFingerprint is unused in the body on purpose: unstable_cache folds the arguments into the cache key.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (providerId: string, envFingerprint: string): Promise<ProviderData> => {
    const p = providerById(providerId);
    if (!p) throw new Error("unknown provider");
    const r = await runProvider(p, process.env);
    if (r.state !== "ok") throw new ProviderFailed(r);
    const { state, ...data } = r;
    void state;
    return data;
  },
  ["admin-stats-provider-v1"],
  { revalidate: CACHE_S },
);
class ProviderFailed extends Error {
  constructor(public result: ProviderResult) {
    super("provider failed");
  }
}

async function getProvider(id: string): Promise<ProviderResult> {
  const p = providerById(id)!;
  const missing = p.env.filter((n) => !process.env[n]?.trim());
  // Missing env → "not connected" straight away: no network call and nothing cached.
  if (missing.length) return { state: "not_connected", missing };
  const fp = createHash("sha256");
  for (const name of p.env) fp.update(name).update("=").update(process.env[name] ?? "").update("\0");
  try {
    return { state: "ok", ...(await cachedProviderData(id, fp.digest("hex").slice(0, 12))) };
  } catch (e) {
    if (e instanceof ProviderFailed) return e.result;
    if (e && typeof e === "object" && "result" in e) return (e as ProviderFailed).result;
    return { state: "error", error: "טעינת הנתונים נכשלה." };
  }
}

// Meta Pixel: 15 min cache keyed on a fingerprint of the token (+ pixel/ad account/app secret/version), never the token.
// Any failed section throws, so errors and partial results are shown but not cached.
class MetaFailed extends Error {
  constructor(public result: MetaStats) {
    super("meta failed");
  }
}
const cachedMeta = unstable_cache(
  // fingerprint is unused in the body on purpose: unstable_cache folds the arguments into the cache key.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (fingerprint: string): Promise<MetaStats> => {
    const r = await loadMeta(process.env);
    if (r.state !== "ok" || metaAnyFailed(r)) throw new MetaFailed(r);
    return r;
  },
  ["admin-stats-meta-v1"],
  { revalidate: CACHE_S },
);

async function getMeta(): Promise<MetaStats> {
  const cfg = resolveMetaConfig(process.env);
  if (!cfg.ok) return loadMeta(process.env); // "not connected" or a config error: no network call, nothing cached
  try {
    return await cachedMeta(metaFingerprint(cfg.config));
  } catch (e) {
    if (e && typeof e === "object" && "result" in e) return (e as MetaFailed).result;
    return { state: "invalid_config", error: "טעינת הנתונים מ-Meta נכשלה." };
  }
}

async function getRevenueCat(): Promise<RevenueCatStats> {
  const { key, projectId } = resolveConfig(process.env);
  if (!key) return loadRevenueCat(process.env); // "not connected", no network call, nothing cached
  const fingerprint = createHash("sha256").update(key).digest("hex").slice(0, 12);
  try {
    return await cachedRevenueCat(projectId, fingerprint);
  } catch (e) {
    if (e && typeof e === "object" && "result" in e) return (e as AllFailed).result;
    return { state: "invalid_config", error: "טעינת הנתונים מ-RevenueCat נכשלה." };
  }
}

const TZ = "Asia/Jerusalem";
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("he-IL", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const fmtDay = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;

const OVERVIEW_LABELS: Record<string, string> = {
  active_trials: "ניסיונות פעילים",
  active_subscriptions: "מנויים פעילים",
  mrr: "MRR (הכנסה חודשית חוזרת)",
  revenue: "הכנסות, 28 ימים",
  new_customers: "לקוחות חדשים, 28 ימים",
  active_users: "לקוחות פעילים, 28 ימים",
};
const OVERVIEW_ORDER = Object.keys(OVERVIEW_LABELS);

function fmtValue(value: number, unit: string, currency: string | null) {
  if (unit === "$" || unit === "currency")
    return new Intl.NumberFormat("he-IL", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat("he-IL").format(value);
}

const card = "min-w-0 rounded-2xl border-2 border-ink bg-white p-4 shadow-sticker-sm";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={card}>
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const Muted = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-ink-muted">{children}</p>;
const ErrorNote = ({ msg }: { msg: string }) => (
  <p role="status" className="rounded-lg border border-bubblegum bg-bubblegum/10 p-2 text-sm">
    {msg}
  </p>
);

function SectionView<T>({ s, children }: { s: Section<T>; children: (d: T) => React.ReactNode }) {
  return s.ok ? <>{children(s.data)}</> : <ErrorNote msg={s.error} />;
}

function Totals({ rows, empty }: { rows: SegmentTotal[]; empty: string }) {
  if (!rows.length) return <Muted>{empty}</Muted>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-ink/10 last:border-0">
            <td className="py-1.5 pe-2 [overflow-wrap:anywhere]">{r.label}</td>
            <td className="py-1.5 text-end font-bold tabular-nums">{new Intl.NumberFormat("he-IL").format(r.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Bars({ points, label }: { points: DailyPoint[]; label: string }) {
  if (!points.length) return <Muted>אין נתונים בטווח.</Muted>;
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((a, p) => a + p.value, 0);
  return (
    <figure>
      <figcaption className="mb-2 text-sm">
        {label}: <b className="tabular-nums">{total}</b> ב-{points.length} ימים
      </figcaption>
      {/* dir=ltr so time runs left to right like every chart; the dates below say which end is which. */}
      <div dir="ltr" className="flex h-24 items-end gap-[2px]" role="img" aria-label={`${label}, סדרה יומית`}>
        {points.map((p) => (
          <div
            key={p.date}
            title={`${fmtDay(p.date)}: ${p.value}${p.incomplete ? " (חלקי)" : ""}`}
            className={`flex-1 rounded-t-sm ${p.incomplete ? "bg-grape/40" : "bg-grape"}`}
            style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
          />
        ))}
      </div>
      <div dir="ltr" className="mt-1 flex justify-between text-xs text-ink-muted tabular-nums">
        <span>{fmtDay(points[0].date)}</span>
        <span>{fmtDay(points[points.length - 1].date)}</span>
      </div>
    </figure>
  );
}

function NotConnected({ missing, note }: { missing: string[]; note?: string }) {
  return (
    <div className="space-y-1">
      <p className="font-bold">לא מחובר</p>
      {missing.length > 0 && (
        <Muted>
          חסרים משתני סביבה: <code dir="ltr">{missing.join(", ")}</code>
        </Muted>
      )}
      {note && <Muted>{note}</Muted>}
    </div>
  );
}

function DataTable({ t }: { t: Table }) {
  if (!t.rows.length) return <Muted>{t.empty}</Muted>;
  return (
    <div className="max-w-full overflow-x-auto" tabIndex={0} role="region" aria-label={t.title}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-ink/20 text-start text-xs text-ink-muted">
            {t.columns.map((c, i) => (
              <th key={c} scope="col" className={`py-1.5 pe-2 font-normal ${i === 0 ? "text-start" : "text-end"}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, ri) => (
            <tr key={ri} className="border-b border-ink/10 last:border-0">
              {r.map((cell, i) => (
                <td
                  key={i}
                  dir={i === 0 && t.ltrFirstColumn ? "ltr" : undefined}
                  className={
                    i === 0
                      ? `py-1.5 pe-2 [overflow-wrap:anywhere] ${t.ltrFirstColumn ? "text-end" : ""}`
                      : "whitespace-nowrap py-1.5 pe-2 text-end tabular-nums"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProviderCard({ title, r }: { title: string; r: ProviderResult }) {
  return (
    <Card title={title}>
      {r.state === "not_connected" ? (
        <NotConnected missing={r.missing} note={r.note} />
      ) : r.state === "error" ? (
        <ErrorNote msg={r.error} />
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-ink-muted">
            עודכן לאחרונה: <span className="tabular-nums">{fmtTime(r.fetchedAt)}</span> (שעון ישראל) · טווח: {r.range}
          </p>
          {r.totals.length > 0 ? (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {r.totals.map((x) => (
                <div key={x.label} className="rounded-xl bg-paper p-3">
                  <dt className="text-xs text-ink-muted">{x.label}</dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums">{x.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <Muted>אין נתונים בטווח.</Muted>
          )}
          {r.tables.map((t) => (
            <div key={t.title}>
              <h3 className="mb-1 font-bold">{t.title}</h3>
              <DataTable t={t} />
            </div>
          ))}
          {r.note && <Muted>{r.note}</Muted>}
          {r.link && (
            <a href={r.link.href} className="inline-block text-sm text-grape underline underline-offset-2">
              {r.link.label}
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

const fmtNum = (n: number) => new Intl.NumberFormat("he-IL").format(n);
const fmtDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

function MetaCard({ m }: { m: MetaStats }) {
  const title = "Meta Pixel";
  if (m.state === "not_connected")
    return (
      <Card title={title}>
        <NotConnected missing={m.missing} note="בלי טוקן הכרטיס לא פונה ל-Meta בכלל." />
      </Card>
    );
  if (m.state === "invalid_config")
    return (
      <Card title={title}>
        <ErrorNote msg={m.error} />
      </Card>
    );
  const ev = m.events;
  const sections = [m.pixel, m.events, m.hosts, ...(m.adAccount ? [m.adAccount] : [])];
  const errs = Array.from(new Set(sections.map((x) => (x.ok ? null : x.error))));
  // Every call failed the same way (e.g. an expired token) → one message instead of four.
  if (errs.length === 1 && errs[0] !== null)
    return (
      <Card title={title}>
        <ErrorNote msg={errs[0]} />
      </Card>
    );
  return (
    <Card title={title}>
      <div className="space-y-4">
        <p className="text-xs text-ink-muted">
          עודכן לאחרונה: <span className="tabular-nums">{fmtTime(m.fetchedAt)}</span> (שעון ישראל) · טווח:{" "}
          {`\u2066${fmtDate(m.range.startDay)}–${fmtDate(m.range.endDay)}\u2069`} (28 ימים, שעון ישראל)
        </p>
        <SectionView s={m.pixel}>
          {(p) => (
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl bg-paper p-3">
                <dt className="text-xs text-ink-muted">פיקסל</dt>
                <dd className="font-bold [overflow-wrap:anywhere]">
                  <bdi>{p.name ?? "ללא שם"}</bdi>
                </dd>
                <dd dir="ltr" className="text-end text-xs tabular-nums text-ink-muted">
                  ID {m.pixelId}
                </dd>
              </div>
              <div className="min-w-0 rounded-xl bg-paper p-3">
                <dt className="text-xs text-ink-muted">נתונים אחרונים התקבלו</dt>
                <dd className="font-bold">
                  {p.lastFiredTime ? (
                    <>
                      <bdi className="tabular-nums">{fmtTime(p.lastFiredTime)}</bdi> (שעון ישראל)
                    </>
                  ) : (
                    "עדיין לא התקבלו נתונים"
                  )}
                </dd>
              </div>
            </dl>
          )}
        </SectionView>
        <SectionView s={ev}>
          {(e) => (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-paper p-3">
                  <dt className="text-xs text-ink-muted">סה״כ אירועים, 28 ימים</dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums">{fmtNum(e.total)}</dd>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <dt className="text-xs text-ink-muted">PageView</dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums">{fmtNum(e.byEvent.find((x) => x.label === "PageView")?.value ?? 0)}</dd>
                </div>
              </dl>
              <Bars points={e.daily} label="אירועים ליום" />
              <div>
                <h3 className="mb-1 font-bold">לפי אירוע</h3>
                <DataTable t={{ title: "לפי אירוע", columns: ["אירוע", "אירועים"], rows: e.byEvent.map((r) => [r.label, fmtNum(r.value)]), ltrFirstColumn: true, empty: "לא התקבלו אירועים בטווח." }} />
              </div>
            </div>
          )}
        </SectionView>
        <div>
          <h3 className="mb-1 font-bold">לפי דומיין</h3>
          <SectionView s={m.hosts}>
            {(h) => <DataTable t={{ title: "לפי דומיין", columns: ["דומיין", "אירועים"], rows: h.map((r) => [r.label, fmtNum(r.value)]), ltrFirstColumn: true, empty: "אין נתוני דומיין בטווח." }} />}
          </SectionView>
        </div>
        {m.adAccount && (
          <SectionView s={m.adAccount}>
            {(a) => (
              <Muted>
                חשבון מודעות: <bdi>{a.name ?? "ללא שם"}</bdi> (<bdi>{a.id}</bdi>) · {a.status}
              </Muted>
            )}
          </SectionView>
        )}
        <Muted>
          ספירת אירועים שהפיקסל קיבל (לא משתמשים ייחודיים), לפי שעה מ-Meta ומקובצת לימים לפי שעון ישראל. היום האחרון חלקי. באתר הפיקסל נטען רק אחרי הסכמה לעוגיות.
        </Muted>
      </div>
    </Card>
  );
}

function RevenueCatView({ rc }: { rc: RevenueCatStats }) {
  if (rc.state === "not_connected")
    return (
      <Card title="RevenueCat">
        <NotConnected missing={rc.missing} />
      </Card>
    );
  if (rc.state === "invalid_config")
    return (
      <Card title="RevenueCat">
        <ErrorNote msg={rc.error} />
      </Card>
    );
  return (
    <>
      <Card title="RevenueCat · מבט כללי">
        <SectionView s={rc.overview}>
          {(metrics) => {
            const sorted = [...metrics].sort((a, b) => (OVERVIEW_ORDER.indexOf(a.id) + 99) % 99 - (OVERVIEW_ORDER.indexOf(b.id) + 99) % 99);
            return (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {sorted.map((m) => (
                  <div key={m.id} className="rounded-xl bg-paper p-3">
                    <dt className="text-xs text-ink-muted">{OVERVIEW_LABELS[m.id] ?? m.name}</dt>
                    <dd className="font-display text-2xl font-semibold tabular-nums">{fmtValue(m.value, m.unit, rc.currency)}</dd>
                  </div>
                ))}
              </dl>
            );
          }}
        </SectionView>
      </Card>
      <Card title="סדרה יומית, 28 ימים">
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionView s={rc.dailyNewCustomers}>{(p) => <Bars points={p} label="לקוחות חדשים" />}</SectionView>
          <SectionView s={rc.dailyNewTrials}>{(p) => <Bars points={p} label="ניסיונות חדשים" />}</SectionView>
        </div>
        <Muted>היום האחרון חלקי (בהיר יותר). התאריכים לפי יום UTC של RevenueCat.</Muted>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="iOS / Android · לקוחות חדשים">
          <SectionView s={rc.customersByPlatform}>{(r) => <Totals rows={r} empty="אין לקוחות חדשים בטווח." />}</SectionView>
        </Card>
        <Card title="iOS / Android · ניסיונות חדשים">
          <SectionView s={rc.trialsByPlatform}>{(r) => <Totals rows={r} empty="אין ניסיונות חדשים בטווח." />}</SectionView>
        </Card>
        <Card title={"ייחוס · מקור (\u2066$mediaSource\u2069)"}>
          <SectionView s={rc.customersBySource}>{(r) => <Totals rows={r} empty="אין נתוני ייחוס." />}</SectionView>
        </Card>
        <Card title={"ייחוס · קמפיין (\u2066$campaign\u2069)"}>
          <SectionView s={rc.customersByCampaign}>{(r) => <Totals rows={r} empty="אין נתוני ייחוס." />}</SectionView>
        </Card>
      </div>
      <Muted>לקוחות חדשים ב-28 הימים האחרונים לפי ערכי הייחוס ב-RevenueCat. עד 10 ערכים, השאר תחת Other.</Muted>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <h1 className="font-display text-3xl font-semibold">סטטיסטיקות Kidsit</h1>
      {children}
    </main>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: { e?: string } }) {
  const secret = configuredSecret(process.env.STATS_PASSWORD);
  if (!secret)
    return (
      <Shell>
        <section className={card}>
          <p className="font-bold">הגישה סגורה.</p>
          <Muted>
            הדף נפתח רק כשמוגדר <code dir="ltr">STATS_PASSWORD</code> בסביבה הזו.
          </Muted>
        </section>
      </Shell>
    );

  if (!verifySessionToken(cookies().get(SESSION_COOKIE)?.value, secret))
    return (
      <Shell>
        <form action={login} className={`${card} max-w-sm space-y-3`}>
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
          {searchParams.e && <ErrorNote msg="סיסמה שגויה." />}
          <button type="submit" className="rounded-full border-2 border-ink bg-grape px-5 py-2 font-bold text-white shadow-sticker-sm">
            כניסה
          </button>
        </form>
      </Shell>
    );

  const [rc, providers, meta] = await Promise.all([
    getRevenueCat(),
    Promise.all(EXTRA_PROVIDERS.map((p) => getProvider(p.id))),
    getMeta(),
  ]);
  const updated = rc.state === "ok" ? rc.fetchedAt : new Date().toISOString();

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          RevenueCat עודכן לאחרונה: <span className="tabular-nums">{fmtTime(updated)}</span> (שעון ישראל) · כל מקור מתרענן כל 15 דקות
        </p>
        <form action={logout}>
          <button type="submit" className="underline underline-offset-2">
            יציאה
          </button>
        </form>
      </div>
      <RevenueCatView rc={rc} />
      <div className="grid gap-4">
        {EXTRA_PROVIDERS.map((p, i) => (
          <ProviderCard key={p.id} title={p.title} r={providers[i]} />
        ))}
        <MetaCard m={meta} />
      </div>
    </Shell>
  );
}
