// In-app funnel for /admin/stats, from the anonymous counters behind POST /api/funnel.
// Each install reports each step once, so a step's count is "installs that reached it".
import { FUNNEL_ENTRIES, FUNNEL_STEPS, type FunnelEntry, type FunnelStep } from "@/lib/funnel/constants";
import { loadFunnelEntryRows, loadFunnelRows, type FunnelEntryRow, type FunnelRow } from "@/lib/funnel/db";
import { ConfigError } from "./google-auth";
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
const ENTRY_NOT_REPORTED = "(לא דווח, גרסה ישנה)";

const int = (x: number) => new Intl.NumberFormat("he-IL").format(Math.round(x));
const share = (n: number, base: number) => (base > 0 ? `${((n / base) * 100).toFixed(0)}%` : "—");
const SOURCE_ROWS = 10;
const UNKNOWN_SOURCE = "(לא ידוע)";

/** Where the paywall was opened from. Older app versions send paywall_shown without an entry, so the
 *  remainder of the paywall_shown count is shown as "not reported" instead of being hidden. */
function entryTable(entryRows: FunnelEntryRow[], paywallTotal: number, paywallIos: number, paywallAndroid: number) {
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
    FUNNEL_ENTRY_LABELS[e],
    int(total.get(e) ?? 0),
    int(ios.get(e) ?? 0),
    int(android.get(e) ?? 0),
  ]);
  const missing = paywallTotal - sum(total);
  if (rows.length && missing > 0) {
    rows.push([ENTRY_NOT_REPORTED, int(missing), int(Math.max(0, paywallIos - sum(ios))), int(Math.max(0, paywallAndroid - sum(android)))]);
  }
  return {
    title: "מאיפה נפתח מסך המנוי",
    columns: ["נקודת כניסה", FUNNEL_STEP_LABELS.paywall_shown, "iOS", "Android"],
    rows,
    empty: "עדיין אין נתונים מגרסה שמדווחת נקודת כניסה.",
  };
}

export function buildFunnelData(rows: FunnelRow[], now = new Date(), entryRows: FunnelEntryRow[] = []): ProviderData {
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
    range: "28 הימים האחרונים כולל היום (ימי UTC)",
    totals: [
      { label: FUNNEL_STEP_LABELS.onboarding_done, value: int(base) },
      { label: FUNNEL_STEP_LABELS.answer_received, value: int(count("answer_received")) },
      { label: FUNNEL_STEP_LABELS.paywall_shown, value: int(count("paywall_shown")) },
      { label: FUNNEL_STEP_LABELS.purchase, value: int(count("purchase")) },
    ],
    tables: [
      {
        title: "משפך לפי שלב",
        columns: ["שלב", "התקנות", "מתוך מי שסיים פתיחה", "iOS", "Android"],
        rows: FUNNEL_STEPS.map((step) => [
          FUNNEL_STEP_LABELS[step],
          int(count(step)),
          share(count(step), base),
          int(byPlatform.get(`${step}|ios`) ?? 0),
          int(byPlatform.get(`${step}|android`) ?? 0),
        ]),
        empty: "עדיין אין נתונים.",
      },
      {
        title: "לפי מקור התקנה (Android)",
        columns: ["מקור", FUNNEL_STEP_LABELS.onboarding_done, FUNNEL_STEP_LABELS.answer_received, FUNNEL_STEP_LABELS.purchase],
        rows: sources.map((s) => [s.source || UNKNOWN_SOURCE, int(s.started), int(s.answered), int(s.purchased)]),
        ltrFirstColumn: true,
        empty: "עדיין אין נתונים.",
      },
      entryTable(entryRows, count("paywall_shown"), byPlatform.get("paywall_shown|ios") ?? 0, byPlatform.get("paywall_shown|android") ?? 0),
    ],
    note:
      "כל שלב נספר פעם אחת לכל התקנה, בלי מזהה משתמש או מכשיר. התקנות שסיימו את מסכי הפתיחה בגרסה קודמת של האפליקציה אינן נספרות. מקור ההתקנה מגיע מ-Google Play בלבד; ב-iOS הוא לא ידוע.",
  };
}

export const FUNNEL_PROVIDER: StatsProvider = {
  id: "funnel",
  title: "משפך באפליקציה · ספירה אנונימית",
  env: ["DATABASE_URL"],
  async fetchData(env, _fetchImpl, now) {
    let rows: FunnelRow[];
    try {
      rows = await loadFunnelRows(env.DATABASE_URL!.trim());
    } catch (e) {
      // The table is created by a migration that has to be applied by hand.
      if (e instanceof Error && /funnel_counts/.test(e.message) && /does not exist/.test(e.message)) {
        throw new ConfigError("הטבלה funnel_counts לא קיימת. יש להריץ את db/migrations/002_funnel_counts.sql ואחריו את 003_funnel_app_version_entry.sql.");
      }
      throw e;
    }
    return buildFunnelData(rows, now, await loadFunnelEntryRows(env.DATABASE_URL!.trim()));
  },
};
