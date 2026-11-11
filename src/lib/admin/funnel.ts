// In-app funnel for /admin/stats, from the anonymous counters behind POST /api/funnel.
// Each install reports each step once, so a step's count is "installs that reached it".
import { FUNNEL_STEPS, type FunnelStep } from "@/lib/funnel/constants";
import { loadFunnelRows, type FunnelRow } from "@/lib/funnel/db";
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

const int = (x: number) => new Intl.NumberFormat("he-IL").format(Math.round(x));
const share = (n: number, base: number) => (base > 0 ? `${((n / base) * 100).toFixed(0)}%` : "—");
const SOURCE_ROWS = 10;
const UNKNOWN_SOURCE = "(לא ידוע)";

export function buildFunnelData(rows: FunnelRow[], now = new Date()): ProviderData {
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
        throw new ConfigError("הטבלה funnel_counts לא קיימת. יש להריץ את db/migrations/002_funnel_counts.sql.");
      }
      throw e;
    }
    return buildFunnelData(rows, now);
  },
};
