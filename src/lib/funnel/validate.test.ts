import assert from "node:assert/strict";
import test from "node:test";
import { FUNNEL_STEPS } from "./constants";
import { FUNNEL_UPSERT_SQL, funnelUpsertParams } from "./sql";
import { validateFunnelEvent } from "./validate";

test("a full event validates and keeps only the known fields", () => {
  const r = validateFunnelEvent({ v: 1, step: "answer_received", platform: "android", lang: "he", app_version: "1.0", source: "kidsit.ai" });
  assert.deepEqual(r, { ok: true, value: { step: "answer_received", platform: "android", lang: "he", app_version: "1.0", source: "kidsit.ai" } });
});

test("optional dimensions default to '' so they can sit in the primary key", () => {
  const r = validateFunnelEvent({ v: 1, step: "purchase" });
  assert.deepEqual(r, { ok: true, value: { step: "purchase", platform: "", lang: "", app_version: "", source: "" } });
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
    { v: 1, step: "purchase", app_version: "1.0.14" },
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
