import assert from "node:assert/strict";
import test from "node:test";
import { FUNNEL_PROVIDER, FUNNEL_STEP_LABELS, buildFunnelData } from "./funnel";
import { EXTRA_PROVIDERS, STATS_PROVIDERS, providerById, runProvider } from "./providers";

const NOW = new Date("2026-11-11T12:00:00Z");

test("no DATABASE_URL → not connected, and the provider is registered first", async () => {
  assert.deepEqual(await runProvider(FUNNEL_PROVIDER, {}), { state: "not_connected", missing: ["DATABASE_URL"] });
  assert.equal(STATS_PROVIDERS[0], FUNNEL_PROVIDER);
  assert.equal(providerById("funnel"), FUNNEL_PROVIDER);
  assert.ok(!EXTRA_PROVIDERS.includes(FUNNEL_PROVIDER));
});

test("no rows → zeros and dashes, never invented numbers", () => {
  const d = buildFunnelData([], NOW);
  assert.equal(d.fetchedAt, NOW.toISOString());
  assert.deepEqual(d.totals.map((t) => t.value), ["0", "0", "0", "0"]);
  assert.equal(d.tables[0].rows.length, 8);
  assert.deepEqual(d.tables[0].rows[0], [FUNNEL_STEP_LABELS.onboarding_done, "0", "—", "0", "0"]);
  assert.deepEqual(d.tables[1].rows, []);
});

test("steps are summed across platforms and sources, with a share of the first step", () => {
  const d = buildFunnelData(
    [
      { step: "onboarding_done", platform: "ios", source: "", n: 20 },
      { step: "onboarding_done", platform: "android", source: "google-play", n: 12 },
      { step: "onboarding_done", platform: "android", source: "kidsit.ai", n: 8 },
      { step: "answer_received", platform: "ios", source: "", n: 9 },
      { step: "answer_received", platform: "android", source: "kidsit.ai", n: 6 },
      { step: "answer_received", platform: "android", source: "google-play", n: 5 },
      { step: "purchase", platform: "android", source: "kidsit.ai", n: 2 },
      { step: "not_a_step", platform: "ios", source: "", n: 99 },
      { step: "purchase", platform: "ios", source: "", n: -4 },
    ],
    NOW,
  );
  assert.deepEqual(d.totals.map((t) => t.value), ["40", "20", "0", "2"]);
  const byLabel = new Map(d.tables[0].rows.map((r) => [r[0], r.slice(1)]));
  assert.deepEqual(byLabel.get(FUNNEL_STEP_LABELS.onboarding_done), ["40", "100%", "20", "20"]);
  assert.deepEqual(byLabel.get(FUNNEL_STEP_LABELS.answer_received), ["20", "50%", "9", "11"]);
  assert.deepEqual(byLabel.get(FUNNEL_STEP_LABELS.purchase), ["2", "5%", "0", "2"]);
  assert.deepEqual(d.tables[1].rows, [
    ["(לא ידוע)", "20", "9", "0"],
    ["google-play", "12", "5", "0"],
    ["kidsit.ai", "8", "6", "2"],
  ]);
});

test("paywall entry table: counts per entry, and the rest of paywall_shown shown as not reported", () => {
  const d = buildFunnelData(
    [
      { step: "paywall_shown", platform: "ios", source: "", n: 10 },
      { step: "paywall_shown", platform: "android", source: "kidsit.ai", n: 6 },
    ],
    NOW,
    [
      { entry: "first_moment", platform: "ios", n: 5 },
      { entry: "first_moment", platform: "android", n: 2 },
      { entry: "settings", platform: "ios", n: 1 },
      { entry: "unknown_entry", platform: "ios", n: 50 },
      { entry: "add_child", platform: "ios", n: -3 },
    ],
  );
  const t = d.tables[2];
  assert.equal(t.title, "מאיפה נפתח מסך המנוי");
  assert.deepEqual(t.rows, [
    ["אחרי הרגע הראשון", "7", "5", "2"],
    ["מההגדרות", "1", "1", "0"],
    ["(לא דווח, גרסה ישנה)", "8", "4", "4"],
  ]);
});

test("paywall entry table is empty until a version that sends entry reports, and the first two tables are unchanged", () => {
  const rows = [{ step: "paywall_shown", platform: "ios", source: "", n: 4 }];
  const without = buildFunnelData(rows, NOW);
  const withEmpty = buildFunnelData(rows, NOW, []);
  assert.deepEqual(without.tables[2].rows, []);
  assert.deepEqual(withEmpty, without);
  assert.equal(without.tables.length, 3);
  assert.deepEqual(without.tables.slice(0, 2), buildFunnelData(rows, NOW, [{ entry: "settings", platform: "ios", n: 1 }]).tables.slice(0, 2));
});
