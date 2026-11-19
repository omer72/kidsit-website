import assert from "node:assert/strict";
import test from "node:test";
import { FUNNEL_ENTRIES, FUNNEL_STEPS } from "./constants";
import {
  FUNNEL_ENTRY_SUMMARY_SQL,
  FUNNEL_UPSERT_SQL,
  FUNNEL_UPSERT_WITH_ENTRY_SQL,
  funnelUpsertParams,
  funnelUpsertWithEntryParams,
} from "./sql";
import { validateFunnelEvent } from "./validate";

test("a full event validates and keeps only the known fields", () => {
  const r = validateFunnelEvent({ v: 1, step: "answer_received", platform: "android", lang: "he", app_version: "1.0", source: "kidsit.ai" });
  assert.deepEqual(r, { ok: true, value: { step: "answer_received", platform: "android", lang: "he", app_version: "1.0", source: "kidsit.ai", entry: "" } });
});

test("optional dimensions default to '' so they can sit in the primary key", () => {
  const r = validateFunnelEvent({ v: 1, step: "purchase" });
  assert.deepEqual(r, { ok: true, value: { step: "purchase", platform: "", lang: "", app_version: "", source: "", entry: "" } });
});

test("every step in the closed list is accepted, nothing else", () => {
  for (const step of FUNNEL_STEPS) assert.equal(validateFunnelEvent({ v: 1, step }).ok, true, step);
  for (const step of ["", "install", "Purchase", 3, null, undefined]) {
    assert.equal(validateFunnelEvent({ v: 1, step }).ok, false, String(step));
  }
});

test("unknown fields are rejected, so an identifier cannot ride along", () => {
  for (const extra of ["user_id", "rc_user", "device_id", "install_id", "ts", "story"]) {
    const r = validateFunnelEvent({ v: 1, step: "child_added", [extra]: "x" });
    assert.ok(!r.ok && r.issues.some((i) => i.path === extra && i.code === "unknown_field"), extra);
  }
});

test("bad shapes and values are rejected", () => {
  for (const body of [null, "x", 1, [], [{ v: 1, step: "purchase" }]]) assert.equal(validateFunnelEvent(body).ok, false);
  const bad: Record<string, unknown>[] = [
    { v: 2, step: "purchase" },
    { step: "purchase" },
    { v: 1, step: "purchase", platform: "web" },
    { v: 1, step: "purchase", lang: "fr" },
    { v: 1, step: "purchase", app_version: "1.0.14.2" },
    { v: 1, step: "purchase", app_version: "1.0." },
    { v: 1, step: "purchase", app_version: "1" },
    { v: 1, step: "purchase", app_version: "1.0.14-beta" },
    { v: 1, step: "purchase", app_version: "1.0.1234" },
    { v: 1, step: "purchase", app_version: "1234.0" },
    { v: 1, step: "purchase", app_version: " 1.0.14" },
    { v: 1, step: "purchase", app_version: "1.0.14\n" },
    { v: 1, step: "purchase", app_version: 1.0 },
    { v: 1, step: "purchase", app_version: "abc" },
    { v: 1, step: "purchase", source: "Has Space" },
    { v: 1, step: "purchase", source: "UPPER" },
    { v: 1, step: "purchase", source: "a".repeat(41) },
    { v: 1, step: "purchase", source: "someone@example.com" },
    { v: 1, step: "purchase", source: "" },
    { v: 1, step: "purchase", source: 7 },
  ];
  for (const body of bad) assert.equal(validateFunnelEvent(body).ok, false, JSON.stringify(body));
});

test("the upsert only bumps a counter: five parameters, server-side day, no request data", () => {
  const r = validateFunnelEvent({ v: 1, step: "moment_sent", platform: "ios", lang: "en", app_version: "1.1" });
  assert.ok(r.ok);
  assert.deepEqual(funnelUpsertParams(r.value), ["moment_sent", "ios", "en", "1.1", ""]);
  assert.match(FUNNEL_UPSERT_SQL, /now\(\) AT TIME ZONE 'utc'\)::date/);
  assert.match(FUNNEL_UPSERT_SQL, /DO UPDATE SET n = funnel_counts\.n \+ 1/);
  assert.equal((FUNNEL_UPSERT_SQL.match(/\$\d/g) ?? []).length, 5);
});

test("app_version accepts major.minor and major.minor.patch, so the app's full version is stored", () => {
  for (const app_version of ["1.0", "1.0.13", "1.0.14", "12.34.56", "999.999.999"]) {
    const r = validateFunnelEvent({ v: 1, step: "answer_received", platform: "ios", app_version });
    assert.ok(r.ok && r.value.app_version === app_version, app_version);
  }
});

test("the 1.0.14 app payload (full version, source kept) validates", () => {
  const r = validateFunnelEvent({ v: 1, step: "moment_sent", platform: "android", lang: "he", app_version: "1.0.14", source: "google-play" });
  assert.deepEqual(r, { ok: true, value: { step: "moment_sent", platform: "android", lang: "he", app_version: "1.0.14", source: "google-play", entry: "" } });
});

test("entry is optional on paywall_shown and limited to the closed list", () => {
  assert.deepEqual(validateFunnelEvent({ v: 1, step: "paywall_shown" }), {
    ok: true,
    value: { step: "paywall_shown", platform: "", lang: "", app_version: "", source: "", entry: "" },
  });
  for (const entry of FUNNEL_ENTRIES) {
    const r = validateFunnelEvent({ v: 1, step: "paywall_shown", platform: "ios", app_version: "1.0.14", entry });
    assert.ok(r.ok && r.value.entry === entry, entry);
  }
  assert.deepEqual(FUNNEL_ENTRIES, ["first_moment", "free_limit", "add_child", "settings"]);
  for (const entry of ["", "First_Moment", "onboarding", "paywall", "first_moment ", 1, null, true, ["settings"]]) {
    const r = validateFunnelEvent({ v: 1, step: "paywall_shown", entry });
    assert.ok(!r.ok && r.issues.some((i) => i.path === "entry" && i.code === "invalid"), JSON.stringify(entry));
  }
});

test("entry is rejected on every step except paywall_shown", () => {
  for (const step of FUNNEL_STEPS.filter((s) => s !== "paywall_shown")) {
    for (const entry of ["first_moment", "settings", "nope"]) {
      const r = validateFunnelEvent({ v: 1, step, entry });
      assert.ok(!r.ok && r.issues.some((i) => i.path === "entry" && i.code === "not_allowed_for_step"), `${step}/${entry}`);
    }
  }
});

test("source and the other fields are unchanged next to entry", () => {
  const r = validateFunnelEvent({ v: 1, step: "paywall_shown", platform: "android", lang: "en", app_version: "1.0.14", source: "kidsit.ai", entry: "free_limit" });
  assert.deepEqual(r, { ok: true, value: { step: "paywall_shown", platform: "android", lang: "en", app_version: "1.0.14", source: "kidsit.ai", entry: "free_limit" } });
  assert.equal(validateFunnelEvent({ v: 1, step: "paywall_shown", entry: "settings", user_id: "x" }).ok, false);
});

test("a paywall_shown with entry bumps both counters in one statement; without entry the old statement is used", () => {
  const r = validateFunnelEvent({ v: 1, step: "paywall_shown", platform: "ios", lang: "he", app_version: "1.0.14", entry: "add_child" });
  assert.ok(r.ok);
  assert.deepEqual(funnelUpsertWithEntryParams(r.value), ["paywall_shown", "ios", "he", "1.0.14", "", "add_child"]);
  assert.equal(new Set(FUNNEL_UPSERT_WITH_ENTRY_SQL.match(/\$\d/g)).size, 6);
  assert.match(FUNNEL_UPSERT_WITH_ENTRY_SQL, /WITH bump AS \(\s*INSERT INTO funnel_counts/);
  assert.match(FUNNEL_UPSERT_WITH_ENTRY_SQL, /INSERT INTO funnel_entry_counts \(day, platform, app_version, entry, n\)/);
  assert.match(FUNNEL_UPSERT_WITH_ENTRY_SQL, /DO UPDATE SET n = funnel_entry_counts\.n \+ 1/);
  assert.match(FUNNEL_ENTRY_SUMMARY_SQL, /FROM funnel_entry_counts/);
  const old = validateFunnelEvent({ v: 1, step: "paywall_shown", platform: "ios" });
  assert.ok(old.ok);
  assert.equal(funnelUpsertParams(old.value).length, 5);
  assert.equal((FUNNEL_UPSERT_SQL.match(/\$\d/g) ?? []).length, 5);
});

test("the migration accepts the same version shape and the same entries as the validator", async () => {
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync(new URL("../../../db/migrations/003_funnel_app_version_entry.sql", import.meta.url), "utf8");
  assert.ok(sql.includes("'^([0-9]{1,3}\\.[0-9]{1,3}(\\.[0-9]{1,3})?)?$'"));
  for (const e of FUNNEL_ENTRIES) assert.ok(sql.includes(`'${e}'`), e);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS funnel_entry_counts/);
  assert.doesNotMatch(sql, /DROP TABLE|DELETE FROM|TRUNCATE|UPDATE funnel/i);
});
