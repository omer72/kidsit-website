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
