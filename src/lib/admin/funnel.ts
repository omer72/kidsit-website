// In-app funnel for /admin/stats, from the anonymous counters behind POST /api/funnel.
// Each install reports each step once, so a step's count is "installs that reached it".
import { FUNNEL_ENTRIES, FUNNEL_STEPS, type FunnelEntry, type FunnelStep } from "@/lib/funnel/constants";
import { loadFunnelEntryRows, loadFunnelRows, type FunnelEntryRow, type FunnelRow } from "@/lib/funnel/db";
import { ConfigError } from "./google-auth";
import { localeOf, tr, type Lang } from "./lang";
import type { ProviderData, StatsProvider } from "./providers";

export const FUNNEL_STEP_LABELS: Record<FunnelStep, string> = {
  onboarding_done: "סיימו את מסכי הפתיחה",
  child_added: "הוסיפו ילד",
  moment_sent: "שלחו רגע ראשון",
  answer_received: "קיבלו תשובה ראשונה",
  moment_rated: "דירגו תשובה",
  paywall_shown: "ראו את מסך המנוי",
  paywall_dismissed: "סגרו את מסך המנוי",
  purchase: "התחילו ניסיון או מנוי",
};

export const FUNNEL_ENTRY_LABELS: Record<FunnelEntry, string> = {
  first_moment: "אחרי הרגע הראשון",
  free_limit: "סוף התשובות בחינם",
  add_child: "הוספת ילד",
  settings: "מההגדרות",
};
export const FUNNEL_STEP_LABELS_EN: Record<FunnelStep, string> = {
  onboarding_done: "Finished onboarding",
  child_added: "Added a child",
  moment_sent: "Sent a first moment",
  answer_received: "Got a first answer",
  moment_rated: "Rated an answer",
  paywall_shown: "Saw the paywall",
  paywall_dismissed: "Dismissed the paywall",
  purchase: "Started a trial or subscription",
};

export const FUNNEL_ENTRY_LABELS_EN: Record<FunnelEntry, string> = {
  first_moment: "After the first moment",
  free_limit: "End of free answers",
  add_child: "Add child",
  settings: "From settings",
};
const stepLabels = (lang: Lang) => (lang === "en" ? FUNNEL_STEP_LABELS_EN : FUNNEL_STEP_LABELS);
const entryLabels = (lang: Lang) => (lang === "en" ? FUNNEL_ENTRY_LABELS_EN : FUNNEL_ENTRY_LABELS);

const intFor = (lang: Lang) => (x: number) => new Intl.NumberFormat(localeOf(lang)).format(Math.round(x));
const share = (n: number, base: number) => (base > 0 ? `${((n / base) * 100).toFixed(0)}%` : "—");
const SOURCE_ROWS = 10;
const MAX_VERSIONS = 4;
const OLDER_COL = "older";
const UNKNOWN_COL = "unknown";

/** Descending by major.minor[.patch], missing parts treated as 0 ("1.0" sorts as "1.0.0"). */
function compareVersionsDesc(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** The newest `max` distinct non-empty versions seen, newest first. */
function topVersions(versions: string[], max = MAX_VERSIONS): string[] {
  const set = new Set<string>();
  for (const v of versions) if (v) set.add(v);
  return Array.from(set).sort(compareVersionsDesc).slice(0, max);
}

/** '' (not sent) buckets as "unknown"; a real version outside the kept top set buckets as "older". */
const versionColumnOf = (kept: readonly string[], v: string): string => (v === "" ? UNKNOWN_COL : kept.includes(v) ? v : OLDER_COL);

const versionColumnLabel = (lang: Lang) => (col: string) =>
  col === OLDER_COL ? tr(lang, "גרסאות ישנות יותר", "Older versions") : col === UNKNOWN_COL ? tr(lang, "לא ידוע", "Unknown") : col;

/** Column order: the kept versions newest first, then "older", then "unknown" — each only if it has any data. */
function versionColumnOrder(kept: readonly string[], present: ReadonlySet<string>): string[] {
  return [...kept.filter((v) => present.has(v)), ...([OLDER_COL, UNKNOWN_COL] as const).filter((c) => present.has(c))];
}

/** Rows are funnel steps; columns are app versions (newest first, at most MAX_VERSIONS, the rest grouped as
 *  "Older"/"Unknown"); each cell is that version's own share of its "Finished onboarding" count, so versions
 *  with very different install counts stay comparable. Empty when no row carries an app version. */
function versionFunnelTable(rows: FunnelRow[], lang: Lang) {
  const kept = topVersions(rows.map((r) => r.app_version));
  const perCol = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!(FUNNEL_STEPS as readonly string[]).includes(r.step) || !Number.isFinite(r.n) || r.n <= 0) continue;
    const col = versionColumnOf(kept, r.app_version);
    const m = perCol.get(col) ?? new Map<string, number>();
    m.set(r.step, (m.get(r.step) ?? 0) + r.n);
    perCol.set(col, m);
  }
  const cols = versionColumnOrder(kept, new Set(perCol.keys()));
  const label = versionColumnLabel(lang);
  const baseFor = (c: string) => perCol.get(c)?.get("onboarding_done") ?? 0;
  return {
    title: tr(lang, "משפך לפי גרסת אפליקציה", "Funnel by app version"),
    columns: [tr(lang, "שלב", "Step"), ...cols.map(label)],
    rows: cols.length
      ? FUNNEL_STEPS.map((step) => [stepLabels(lang)[step], ...cols.map((c) => share(perCol.get(c)?.get(step) ?? 0, baseFor(c)))])
      : [],
    empty: tr(lang, "עדיין אין נתונים עם גרסת אפליקציה.", "No data yet with an app version."),
  };
}

/** Same version bucketing as above, applied to "where the paywall was opened from": rows are entry points,
 *  columns are app versions, cells are raw counts (matching the existing by-platform table's style). */
function versionEntryTable(entryRows: FunnelEntryRow[], funnelRows: FunnelRow[], lang: Lang) {
  const int = intFor(lang);
  const kept = topVersions([...entryRows.map((r) => r.app_version), ...funnelRows.filter((r) => r.step === "paywall_shown").map((r) => r.app_version)]);

  const paywallByCol = new Map<string, number>();
  for (const r of funnelRows) {
    if (r.step !== "paywall_shown" || !Number.isFinite(r.n) || r.n <= 0) continue;
    const col = versionColumnOf(kept, r.app_version);
    paywallByCol.set(col, (paywallByCol.get(col) ?? 0) + r.n);
  }

  const perCol = new Map<string, Map<string, number>>();
  for (const r of entryRows) {
    if (!(FUNNEL_ENTRIES as readonly string[]).includes(r.entry) || !Number.isFinite(r.n) || r.n <= 0) continue;
    const col = versionColumnOf(kept, r.app_version);
    const m = perCol.get(col) ?? new Map<string, number>();
    m.set(r.entry, (m.get(r.entry) ?? 0) + r.n);
    perCol.set(col, m);
  }

  const present = new Set<string>([...Array.from(perCol.keys()), ...Array.from(paywallByCol.keys())]);
  const cols = versionColumnOrder(kept, present);
  const label = versionColumnLabel(lang);
  const sumCol = (c: string) => Array.from(perCol.get(c)?.values() ?? []).reduce((a, b) => a + b, 0);

  const rows = FUNNEL_ENTRIES.filter((e) => cols.some((c) => (perCol.get(c)?.get(e) ?? 0) > 0)).map((e) => [
    entryLabels(lang)[e],
    ...cols.map((c) => int(perCol.get(c)?.get(e) ?? 0)),
  ]);
  const missing = cols.map((c) => Math.max(0, (paywallByCol.get(c) ?? 0) - sumCol(c)));
  if (rows.length && missing.some((m) => m > 0)) {
    rows.push([tr(lang, "(לא דווח, גרסה ישנה)", "(not reported, older version)"), ...missing.map(int)]);
  }

  return {
    title: tr(lang, "מאיפה נפתח מסך המנוי, לפי גרסה", "Where the paywall was opened from, by app version"),
    columns: [tr(lang, "נקודת כניסה", "Entry point"), ...cols.map(label)],
    rows,
    empty: tr(lang, "עדיין אין נתונים מגרסה שמדווחת נקודת כניסה.", "No data yet from a version that reports the entry point."),
  };
}

/** Where the paywall was opened from. Older app versions send paywall_shown without an entry, so the
 *  remainder of the paywall_shown count is shown as "not reported" instead of being hidden. */
function entryTable(entryRows: FunnelEntryRow[], paywallTotal: number, paywallIos: number, paywallAndroid: number, lang: Lang) {
  const int = intFor(lang);
  const total = new Map<string, number>();
  const ios = new Map<string, number>();
  const android = new Map<string, number>();
  for (const r of entryRows) {
    if (!(FUNNEL_ENTRIES as readonly string[]).includes(r.entry) || !Number.isFinite(r.n) || r.n <= 0) continue;
    total.set(r.entry, (total.get(r.entry) ?? 0) + r.n);
    if (r.platform === "ios") ios.set(r.entry, (ios.get(r.entry) ?? 0) + r.n);
    if (r.platform === "android") android.set(r.entry, (android.get(r.entry) ?? 0) + r.n);
  }
  const sum = (m: Map<string, number>) => Array.from(m.values()).reduce((a, b) => a + b, 0);
  const rows = FUNNEL_ENTRIES.filter((e) => total.has(e)).map((e) => [
    entryLabels(lang)[e],
    int(total.get(e) ?? 0),
    int(ios.get(e) ?? 0),
    int(android.get(e) ?? 0),
  ]);
  const missing = paywallTotal - sum(total);
  if (rows.length && missing > 0) {
    rows.push([tr(lang, "(לא דווח, גרסה ישנה)", "(not reported, older version)"), int(missing), int(Math.max(0, paywallIos - sum(ios))), int(Math.max(0, paywallAndroid - sum(android)))]);
  }
  return {
    title: tr(lang, "מאיפה נפתח מסך המנוי", "Where the paywall was opened from"),
    columns: [tr(lang, "נקודת כניסה", "Entry point"), stepLabels(lang).paywall_shown, "iOS", "Android"],
    rows,
    empty: tr(lang, "עדיין אין נתונים מגרסה שמדווחת נקודת כניסה.", "No data yet from a version that reports the entry point."),
  };
}

export function buildFunnelData(rows: FunnelRow[], now = new Date(), entryRows: FunnelEntryRow[] = [], lang: Lang = "he"): ProviderData {
  const int = intFor(lang);
  const L = stepLabels(lang);
  const total = new Map<string, number>();
  const byPlatform = new Map<string, number>();
  const bySource = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!(FUNNEL_STEPS as readonly string[]).includes(r.step) || !Number.isFinite(r.n) || r.n <= 0) continue;
    total.set(r.step, (total.get(r.step) ?? 0) + r.n);
    const pk = `${r.step}|${r.platform}`;
    byPlatform.set(pk, (byPlatform.get(pk) ?? 0) + r.n);
    const src = bySource.get(r.source) ?? new Map<string, number>();
    src.set(r.step, (src.get(r.step) ?? 0) + r.n);
    bySource.set(r.source, src);
  }
  const count = (step: FunnelStep) => total.get(step) ?? 0;
  const base = count("onboarding_done");

  const sources = Array.from(bySource.entries())
    .map(([source, steps]) => ({
      source,
      started: steps.get("onboarding_done") ?? 0,
      answered: steps.get("answer_received") ?? 0,
      purchased: steps.get("purchase") ?? 0,
    }))
    .filter((s) => s.started || s.answered || s.purchased)
    .sort((a, b) => b.started - a.started || b.answered - a.answered || a.source.localeCompare(b.source))
    .slice(0, SOURCE_ROWS);

  return {
    fetchedAt: now.toISOString(),
    range: tr(lang, "28 הימים האחרונים כולל היום (ימי UTC)", "Last 28 days including today (UTC days)"),
    totals: [
      { label: L.onboarding_done, value: int(base) },
      { label: L.answer_received, value: int(count("answer_received")) },
      { label: L.paywall_shown, value: int(count("paywall_shown")) },
      { label: L.purchase, value: int(count("purchase")) },
    ],
    tables: [
      {
        title: tr(lang, "משפך לפי שלב", "Funnel by step"),
        columns: [
          tr(lang, "שלב", "Step"),
          tr(lang, "התקנות", "Installs"),
          tr(lang, "מתוך מי שסיים פתיחה", "Of those who finished onboarding"),
          "iOS",
          "Android",
        ],
        rows: FUNNEL_STEPS.map((step) => [
          L[step],
          int(count(step)),
          share(count(step), base),
          int(byPlatform.get(`${step}|ios`) ?? 0),
          int(byPlatform.get(`${step}|android`) ?? 0),
        ]),
        empty: tr(lang, "עדיין אין נתונים.", "No data yet."),
      },
      versionFunnelTable(rows, lang),
      {
        title: tr(lang, "לפי מקור התקנה (Android)", "By install source (Android)"),
        columns: [tr(lang, "מקור", "Source"), L.onboarding_done, L.answer_received, L.purchase],
        rows: sources.map((s) => [s.source || tr(lang, "(לא ידוע)", "(unknown)"), int(s.started), int(s.answered), int(s.purchased)]),
        ltrFirstColumn: true,
        empty: tr(lang, "עדיין אין נתונים.", "No data yet."),
      },
      entryTable(entryRows, count("paywall_shown"), byPlatform.get("paywall_shown|ios") ?? 0, byPlatform.get("paywall_shown|android") ?? 0, lang),
      versionEntryTable(entryRows, rows, lang),
    ],
    note: tr(
      lang,
      "כל שלב נספר פעם אחת לכל התקנה, בלי מזהה משתמש או מכשיר. התקנות שסיימו את מסכי הפתיחה בגרסה קודמת של האפליקציה אינן נספרות. מקור ההתקנה מגיע מ-Google Play בלבד; ב-iOS הוא לא ידוע.",
      "Each step is counted once per install, with no user or device ID. Installs that finished onboarding in an earlier version of the app are not counted. The install source comes from Google Play only; on iOS it is unknown.",
    ),
  };
}

export const FUNNEL_PROVIDER: StatsProvider = {
  id: "funnel",
  title: "משפך באפליקציה · ספירה אנונימית",
  titleEn: "In-app funnel · anonymous counts",
  env: ["DATABASE_URL"],
  async fetchData(env, _fetchImpl, now, lang = "he") {
    let rows: FunnelRow[];
    try {
      rows = await loadFunnelRows(env.DATABASE_URL!.trim());
    } catch (e) {
      // The table is created by a migration that has to be applied by hand.
      if (e instanceof Error && /funnel_counts/.test(e.message) && /does not exist/.test(e.message)) {
        throw new ConfigError(
          "הטבלה funnel_counts לא קיימת. יש להריץ את db/migrations/002_funnel_counts.sql ואחריו את 003_funnel_app_version_entry.sql.",
          "The funnel_counts table does not exist. Run db/migrations/002_funnel_counts.sql, then 003_funnel_app_version_entry.sql.",
        );
      }
      throw e;
    }
    return buildFunnelData(rows, now, await loadFunnelEntryRows(env.DATABASE_URL!.trim()), lang);
  },
};
