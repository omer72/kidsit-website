import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { configuredSecret, SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import { allSectionsFailed, loadRevenueCat, resolveConfig, type DailyPoint, type RevenueCatStats, type Section, type SegmentTotal } from "@/lib/admin/revenuecat";
import { loadMeta, metaAnyFailed, metaFingerprint, resolveMetaConfig, type MetaStats } from "@/lib/admin/meta";
import { STATS_PROVIDERS, providerById, providerTitle, runProvider, type ProviderData, type ProviderResult, type Table } from "@/lib/admin/providers";
import { localeOf, statsPath, tr, type Lang } from "@/lib/admin/lang";
import { login, logout } from "./actions";

// The stats page body, shared by /admin/stats (lang "he", RTL) and /admin/stats/en (lang "en", LTR). The route files
// own `dynamic`, `metadata` and the <html> element (see (he)/ and (en)/); everything else, including the password
// gate, is the same code for both languages.

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
  async (projectId: string, keyFingerprint: string, lang: Lang): Promise<RevenueCatStats> => {
    const r = await loadRevenueCat({ ...process.env, REVENUECAT_PROJECT_ID: projectId }, undefined, undefined, lang);
    if (r.state === "ok" && allSectionsFailed(r)) throw new AllFailed(r);
    return r;
  },
  ["admin-stats-revenuecat-v2"],
  { revalidate: CACHE_S },
);

// Google sections: same rules as RevenueCat. 15 min cache keyed on the provider and a fingerprint of its env
// (service-account JSON + property/site), so a new or rotated key shows up at once. A thrown error is never cached.
const cachedProviderData = unstable_cache(
  // envFingerprint is unused in the body on purpose: unstable_cache folds the arguments into the cache key.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (providerId: string, envFingerprint: string, lang: Lang): Promise<ProviderData> => {
    const p = providerById(providerId);
    if (!p) throw new Error("unknown provider");
    const r = await runProvider(p, process.env, undefined, undefined, lang);
    if (r.state !== "ok") throw new ProviderFailed(r);
    const { state, ...data } = r;
    void state;
    return data;
  },
  ["admin-stats-provider-v2"],
  { revalidate: CACHE_S },
);
class ProviderFailed extends Error {
  constructor(public result: ProviderResult) {
    super("provider failed");
  }
}

async function getProvider(id: string, lang: Lang): Promise<ProviderResult> {
  const p = providerById(id)!;
  const missing = p.env.filter((n) => !process.env[n]?.trim());
  // Missing env → "not connected" straight away: no network call and nothing cached.
  if (missing.length) return { state: "not_connected", missing };
  const fp = createHash("sha256");
  for (const name of p.env) fp.update(name).update("=").update(process.env[name] ?? "").update("\0");
  try {
    return { state: "ok", ...(await cachedProviderData(id, fp.digest("hex").slice(0, 12), lang)) };
  } catch (e) {
    if (e instanceof ProviderFailed) return e.result;
    if (e && typeof e === "object" && "result" in e) return (e as ProviderFailed).result;
    return { state: "error", error: tr(lang, "טעינת הנתונים נכשלה.", "Loading the data failed.") };
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
  async (fingerprint: string, lang: Lang): Promise<MetaStats> => {
    const r = await loadMeta(process.env, undefined, undefined, lang);
    if (r.state !== "ok" || metaAnyFailed(r)) throw new MetaFailed(r);
    return r;
  },
  ["admin-stats-meta-v2"],
  { revalidate: CACHE_S },
);

async function getMeta(lang: Lang): Promise<MetaStats> {
  const cfg = resolveMetaConfig(process.env, lang);
  if (!cfg.ok) return loadMeta(process.env, undefined, undefined, lang); // "not connected" or a config error: no network call, nothing cached
  try {
    return await cachedMeta(metaFingerprint(cfg.config), lang);
  } catch (e) {
    if (e && typeof e === "object" && "result" in e) return (e as MetaFailed).result;
    return { state: "invalid_config", error: tr(lang, "טעינת הנתונים מ-Meta נכשלה.", "Loading the data from Meta failed.") };
  }
}

async function getRevenueCat(lang: Lang): Promise<RevenueCatStats> {
  const { key, projectId } = resolveConfig(process.env);
  if (!key) return loadRevenueCat(process.env, undefined, undefined, lang); // "not connected", no network call, nothing cached
  const fingerprint = createHash("sha256").update(key).digest("hex").slice(0, 12);
  try {
    return await cachedRevenueCat(projectId, fingerprint, lang);
  } catch (e) {
    if (e && typeof e === "object" && "result" in e) return (e as AllFailed).result;
    return { state: "invalid_config", error: tr(lang, "טעינת הנתונים מ-RevenueCat נכשלה.", "Loading the data from RevenueCat failed.") };
  }
}

const TZ = "Asia/Jerusalem";
// he-IL: 19.11.2026, 16:32 · en-US: 11/19/2026, 04:32 PM. Both in Israel time.
const fmtTime = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(localeOf(lang), { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
// he: DD.MM · en: MM/DD
const fmtDay = (d: string, lang: Lang) => (lang === "en" ? `${d.slice(5, 7)}/${d.slice(8, 10)}` : `${d.slice(8, 10)}.${d.slice(5, 7)}`);
const fmtInt = (n: number, lang: Lang) => new Intl.NumberFormat(localeOf(lang)).format(n);
const ISRAEL_TIME = (lang: Lang) => tr(lang, "שעון ישראל", "Israel time");

const OVERVIEW_LABELS: Record<string, [string, string]> = {
  active_trials: ["ניסיונות פעילים", "Active trials"],
  active_subscriptions: ["מנויים פעילים", "Active subscriptions"],
  mrr: ["MRR (הכנסה חודשית חוזרת)", "MRR (monthly recurring revenue)"],
  revenue: ["הכנסות, 28 ימים", "Revenue, 28 days"],
  new_customers: ["לקוחות חדשים, 28 ימים", "New customers, 28 days"],
  active_users: ["לקוחות פעילים, 28 ימים", "Active customers, 28 days"],
};
const OVERVIEW_ORDER = Object.keys(OVERVIEW_LABELS);

function fmtValue(value: number, unit: string, currency: string | null, lang: Lang) {
  if (unit === "$" || unit === "currency")
    return new Intl.NumberFormat(localeOf(lang), { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(value);
  return fmtInt(value, lang);
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

function Totals({ rows, empty, lang }: { rows: SegmentTotal[]; empty: string; lang: Lang }) {
  if (!rows.length) return <Muted>{empty}</Muted>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-ink/10 last:border-0">
            <td className="py-1.5 pe-2 [overflow-wrap:anywhere]">{r.label}</td>
            <td className="py-1.5 text-end font-bold tabular-nums">{fmtInt(r.value, lang)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Bars({ points, label, lang }: { points: DailyPoint[]; label: string; lang: Lang }) {
  if (!points.length) return <Muted>{tr(lang, "אין נתונים בטווח.", "No data in range.")}</Muted>;
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((a, p) => a + p.value, 0);
  return (
    <figure>
      <figcaption className="mb-2 text-sm">
        {label}: <b className="tabular-nums">{total}</b> {tr(lang, `ב-${points.length} ימים`, `over ${points.length} days`)}
      </figcaption>
      {/* dir=ltr so time runs left to right like every chart; the dates below say which end is which. */}
      <div dir="ltr" className="flex h-24 items-end gap-[2px]" role="img" aria-label={`${label}, ${tr(lang, "סדרה יומית", "daily series")}`}>
        {points.map((p) => (
          <div
            key={p.date}
            title={`${fmtDay(p.date, lang)}: ${p.value}${p.incomplete ? ` (${tr(lang, "חלקי", "partial")})` : ""}`}
            className={`flex-1 rounded-t-sm ${p.incomplete ? "bg-grape/40" : "bg-grape"}`}
            style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
          />
        ))}
      </div>
      <div dir="ltr" className="mt-1 flex justify-between text-xs text-ink-muted tabular-nums">
        <span>{fmtDay(points[0].date, lang)}</span>
        <span>{fmtDay(points[points.length - 1].date, lang)}</span>
      </div>
    </figure>
  );
}

function NotConnected({ missing, note, lang }: { missing: string[]; note?: string; lang: Lang }) {
  return (
    <div className="space-y-1">
      <p className="font-bold">{tr(lang, "לא מחובר", "Not connected")}</p>
      {missing.length > 0 && (
        <Muted>
          {tr(lang, "חסרים משתני סביבה:", "Missing environment variables:")} <code dir="ltr">{missing.join(", ")}</code>
        </Muted>
      )}
      {note && <Muted>{note}</Muted>}
    </div>
  );
}

function DataTable({ t, lang }: { t: Table; lang: Lang }) {
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
                      ? `py-1.5 pe-2 [overflow-wrap:anywhere] ${t.ltrFirstColumn && lang === "he" ? "text-end" : ""}`
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

function ProviderCard({ title, r, lang }: { title: string; r: ProviderResult; lang: Lang }) {
  return (
    <Card title={title}>
      {r.state === "not_connected" ? (
        <NotConnected missing={r.missing} note={r.note} lang={lang} />
      ) : r.state === "error" ? (
        <ErrorNote msg={r.error} />
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-ink-muted">
            {tr(lang, "עודכן לאחרונה:", "Last updated:")} <span className="tabular-nums">{fmtTime(r.fetchedAt, lang)}</span> ({ISRAEL_TIME(lang)}) · {tr(lang, "טווח:", "Range:")} {r.range}
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
            <Muted>{tr(lang, "אין נתונים בטווח.", "No data in range.")}</Muted>
          )}
          {r.tables.map((t) => (
            <div key={t.title}>
              <h3 className="mb-1 font-bold">{t.title}</h3>
              <DataTable t={t} lang={lang} />
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


function MetaCard({ m, lang }: { m: MetaStats; lang: Lang }) {
  const title = "Meta Pixel";
  if (m.state === "not_connected")
    return (
      <Card title={title}>
        <NotConnected missing={m.missing} note={tr(lang, "בלי טוקן הכרטיס לא פונה ל-Meta בכלל.", "Without a token, the card does not call Meta at all.")} lang={lang} />
      </Card>
    );
  if (m.state === "invalid_config")
    return (
      <Card title={title}>
        <ErrorNote msg={m.error} />
      </Card>
    );
  const sections = [m.pixel, ...(m.adAccount ? [m.adAccount] : [])];
  const errs = Array.from(new Set(sections.map((x) => (x.ok ? null : x.error))));
  // Every call failed the same way (e.g. an expired token) → one message instead of two.
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
          {tr(lang, "עודכן לאחרונה:", "Last updated:")} <span className="tabular-nums">{fmtTime(m.fetchedAt, lang)}</span> ({ISRAEL_TIME(lang)})
        </p>
        <SectionView s={m.pixel}>
          {(p) => (
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl bg-paper p-3">
                <dt className="text-xs text-ink-muted">{tr(lang, "פיקסל", "Pixel")}</dt>
                <dd className="font-bold [overflow-wrap:anywhere]">
                  <bdi>{p.name ?? tr(lang, "ללא שם", "Unnamed")}</bdi>
                </dd>
                <dd dir="ltr" className={`${lang === "he" ? "text-end" : ""} text-xs tabular-nums text-ink-muted`}>
                  ID {m.pixelId}
                </dd>
              </div>
              <div className="min-w-0 rounded-xl bg-paper p-3">
                <dt className="text-xs text-ink-muted">{tr(lang, "נתונים אחרונים התקבלו", "Last data received")}</dt>
                <dd className="font-bold">
                  {p.lastFiredTime ? (
                    <>
                      <bdi className="tabular-nums">{fmtTime(p.lastFiredTime, lang)}</bdi> ({ISRAEL_TIME(lang)})
                    </>
                  ) : (
                    tr(lang, "עדיין לא התקבלו נתונים", "No data received yet")
                  )}
                </dd>
              </div>
            </dl>
          )}
        </SectionView>
        {m.adAccount && (
          <SectionView s={m.adAccount}>
            {(a) => (
              <Muted>
                {tr(lang, "חשבון מודעות:", "Ad account:")} <bdi>{a.name ?? tr(lang, "ללא שם", "Unnamed")}</bdi> (<bdi>{a.id}</bdi>) · {a.status}
              </Muted>
            )}
          </SectionView>
        )}
        <Muted>
          {tr(
            lang,
            "ספירות אירועים לא זמינות דרך ה-API של Meta, אותן רואים ב-Events Manager. באתר הפיקסל נטען רק אחרי הסכמה לעוגיות.",
            "Event counts are not available through the Meta API; see them in Events Manager. On the site, the pixel loads only after cookie consent.",
          )}
        </Muted>
      </div>
    </Card>
  );
}

function RevenueCatView({ rc, lang }: { rc: RevenueCatStats; lang: Lang }) {
  if (rc.state === "not_connected")
    return (
      <Card title="RevenueCat">
        <NotConnected missing={rc.missing} lang={lang} />
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
      <Card title={tr(lang, "RevenueCat · מבט כללי", "RevenueCat · overview")}>
        <SectionView s={rc.overview}>
          {(metrics) => {
            const sorted = [...metrics].sort((a, b) => (OVERVIEW_ORDER.indexOf(a.id) + 99) % 99 - (OVERVIEW_ORDER.indexOf(b.id) + 99) % 99);
            return (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {sorted.map((m) => (
                  <div key={m.id} className="rounded-xl bg-paper p-3">
                    <dt className="text-xs text-ink-muted">{OVERVIEW_LABELS[m.id]?.[lang === "en" ? 1 : 0] ?? m.name}</dt>
                    <dd className="font-display text-2xl font-semibold tabular-nums">{fmtValue(m.value, m.unit, rc.currency, lang)}</dd>
                  </div>
                ))}
              </dl>
            );
          }}
        </SectionView>
      </Card>
      <Card title={tr(lang, "סדרה יומית, 28 ימים", "Daily series, 28 days")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionView s={rc.dailyNewCustomers}>{(p) => <Bars points={p} label={tr(lang, "לקוחות חדשים", "New customers")} lang={lang} />}</SectionView>
          <SectionView s={rc.dailyNewTrials}>{(p) => <Bars points={p} label={tr(lang, "ניסיונות חדשים", "New trials")} lang={lang} />}</SectionView>
        </div>
        <Muted>{tr(lang, "היום האחרון חלקי (בהיר יותר). התאריכים לפי יום UTC של RevenueCat.", "The last day is partial (lighter). Dates follow RevenueCat's UTC day.")}</Muted>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title={tr(lang, "iOS / Android · לקוחות חדשים", "iOS / Android · new customers")}>
          <SectionView s={rc.customersByPlatform}>{(r) => <Totals rows={r} empty={tr(lang, "אין לקוחות חדשים בטווח.", "No new customers in range.")} lang={lang} />}</SectionView>
        </Card>
        <Card title={tr(lang, "iOS / Android · ניסיונות חדשים", "iOS / Android · new trials")}>
          <SectionView s={rc.trialsByPlatform}>{(r) => <Totals rows={r} empty={tr(lang, "אין ניסיונות חדשים בטווח.", "No new trials in range.")} lang={lang} />}</SectionView>
        </Card>
        <Card title={tr(lang, "ייחוס · מקור (\u2066$mediaSource\u2069)", "Attribution · source ($mediaSource)")}>
          <SectionView s={rc.customersBySource}>{(r) => <Totals rows={r} empty={tr(lang, "אין נתוני ייחוס.", "No attribution data.")} lang={lang} />}</SectionView>
        </Card>
        <Card title={tr(lang, "ייחוס · קמפיין (\u2066$campaign\u2069)", "Attribution · campaign ($campaign)")}>
          <SectionView s={rc.customersByCampaign}>{(r) => <Totals rows={r} empty={tr(lang, "אין נתוני ייחוס.", "No attribution data.")} lang={lang} />}</SectionView>
        </Card>
      </div>
      <Muted>{tr(lang, "לקוחות חדשים ב-28 הימים האחרונים לפי ערכי הייחוס ב-RevenueCat. עד 10 ערכים, השאר תחת Other.", "New customers in the last 28 days by RevenueCat attribution values. Up to 10 values; the rest are grouped under Other.")}</Muted>
    </>
  );
}

function Shell({ children, lang }: { children: React.ReactNode; lang: Lang }) {
  const other: Lang = lang === "en" ? "he" : "en";
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="font-display text-3xl font-semibold">{tr(lang, "סטטיסטיקות Kidsit", "Kidsit stats")}</h1>
        {/* Language toggle: a plain link to the same page in the other language (the session cookie covers all of /admin). */}
        <a
          href={statsPath(other)}
          lang={other}
          hrefLang={other}
          className="rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-bold shadow-sticker-sm"
        >
          {other === "en" ? "English" : "עברית"}
        </a>
      </div>
      {children}
    </main>
  );
}

export async function StatsPage({ lang, searchParams }: { lang: Lang; searchParams: { e?: string } }) {
  const secret = configuredSecret(process.env.STATS_PASSWORD);
  if (!secret)
    return (
      <Shell lang={lang}>
        <section className={card}>
          <p className="font-bold">{tr(lang, "הגישה סגורה.", "Access is closed.")}</p>
          <Muted>
            {lang === "en" ? (
              <>
                The page opens only when <code dir="ltr">STATS_PASSWORD</code> is set in this environment.
              </>
            ) : (
              <>
                הדף נפתח רק כשמוגדר <code dir="ltr">STATS_PASSWORD</code> בסביבה הזו.
              </>
            )}
          </Muted>
        </section>
      </Shell>
    );

  if (!verifySessionToken(cookies().get(SESSION_COOKIE)?.value, secret))
    return (
      <Shell lang={lang}>
        <form action={login} className={`${card} max-w-sm space-y-3`}>
          <input type="hidden" name="lang" value={lang} />
          <label htmlFor="password" className="block font-bold">
            {tr(lang, "סיסמה", "Password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border-2 border-ink bg-paper px-3 py-2"
          />
          {searchParams.e && <ErrorNote msg={tr(lang, "סיסמה שגויה.", "Wrong password.")} />}
          <button type="submit" className="rounded-full border-2 border-ink bg-grape px-5 py-2 font-bold text-white shadow-sticker-sm">
            {tr(lang, "כניסה", "Log in")}
          </button>
        </form>
      </Shell>
    );

  const [rc, providers, meta] = await Promise.all([
    getRevenueCat(lang),
    Promise.all(STATS_PROVIDERS.map((p) => getProvider(p.id, lang))),
    getMeta(lang),
  ]);
  const updated = rc.state === "ok" ? rc.fetchedAt : new Date().toISOString();

  return (
    <Shell lang={lang}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          {tr(lang, "RevenueCat עודכן לאחרונה:", "RevenueCat last updated:")} <span className="tabular-nums">{fmtTime(updated, lang)}</span> ({ISRAEL_TIME(lang)}) ·{" "}
          {tr(lang, "כל מקור מתרענן כל 15 דקות", "each source refreshes every 15 minutes")}
        </p>
        <form action={logout}>
          <input type="hidden" name="lang" value={lang} />
          <button type="submit" className="underline underline-offset-2">
            {tr(lang, "יציאה", "Log out")}
          </button>
        </form>
      </div>
      <RevenueCatView rc={rc} lang={lang} />
      <div className="grid gap-4">
        {STATS_PROVIDERS.map((p, i) => (
          <ProviderCard key={p.id} title={providerTitle(p, lang)} r={providers[i]} lang={lang} />
        ))}
        <MetaCard m={meta} lang={lang} />
      </div>
    </Shell>
  );
}
