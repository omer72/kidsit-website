import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SUBMISSION_COLUMNS } from "./constants";
import { isAllowedInsightOrigin } from "./cors";
import { buildInsertStatement } from "./sql";
import { scrubFreeText } from "./scrub";
import { freeTextExpiresOn, isIsoWeekKey, validateInsight, type ValidatedInsight } from "./validate";

const base = {
  schema_v: 1,
  taxonomy_v: 1,
  period: "week",
  period_key: "2026-W44",
  lang: "he",
  platform: "ios",
  app_version: "1.0",
  situations: [
    { type: "bedtime_sleep", great: 1, better: 1, same: 1, worse: 0, unrated: 1 },
    { type: "transitions", great: 0, better: 2, same: 0, worse: 1, unrated: 0 },
  ],
  moves: [{ move: "choice", worked: 2, not_worked: 0 }],
  rating: 4,
  free_text: "הסיכום עזר לי לראות שהערבים הכי קשים",
  free_text_scrubbed: true,
};

function codes(payload: unknown): string[] {
  const result = validateInsight(payload);
  assert.equal(result.ok, false);
  if (result.ok) return [];
  return result.issues.map((issue) => issue.code);
}

test("accepts the spec payload and keeps same as its own count", () => {
  const result = validateInsight(base, new Date("2026-11-01T12:00:00.000Z"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.situations[0].same, 1);
  assert.equal(result.value.period_key, "2026-W44");
  assert.equal(result.value.free_text, base.free_text);
  assert.equal(result.value.free_text_expires_on, freeTextExpiresOn(new Date("2026-11-01T12:00:00.000Z")));
  assert.equal(result.value.rating, 4);
});

test("accepts an empty situations array and omits optional fields", () => {
  const result = validateInsight({ ...base, situations: [], moves: undefined, rating: undefined, free_text: undefined, free_text_scrubbed: undefined });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.situations, []);
  assert.deepEqual(result.value.moves, []);
  assert.equal(result.value.rating, null);
  assert.equal(result.value.free_text, null);
  assert.equal(result.value.free_text_expires_on, null);
});

test("accepts period day while requiring an ISO week key", () => {
  const result = validateInsight({ ...base, period: "day", free_text: undefined, free_text_scrubbed: undefined });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.period, "day");
  assert.equal(result.value.period_key, "2026-W44");
});

test("rejects unknown situation and move enums", () => {
  const situation = validateInsight({
    ...base,
    situations: [{ type: "nap_time", great: 1, better: 0, same: 0, worse: 0, unrated: 0 }],
  });
  assert.equal(situation.ok, false);
  if (!situation.ok) assert.ok(situation.issues.some((issue) => issue.path === "situations[0].type" && issue.code === "unknown_enum"));

  const move = validateInsight({ ...base, moves: [{ move: "bribe", worked: 1, not_worked: 0 }] });
  assert.equal(move.ok, false);
  if (!move.ok) assert.ok(move.issues.some((issue) => issue.path === "moves[0].move" && issue.code === "unknown_enum"));

  assert.ok(codes({ ...base, lang: "fr" }).includes("unknown_enum"));
  assert.ok(codes({ ...base, platform: "web" }).includes("unknown_enum"));
  assert.ok(codes({ ...base, period: "month" }).includes("unknown_enum"));
});

test("rejects extra fields", () => {
  assert.ok(codes({ ...base, bonus: true }).includes("unexpected_field"));
  assert.ok(
    codes({
      ...base,
      situations: [{ type: "eating", great: 0, better: 0, same: 0, worse: 0, unrated: 0, note: "hi" }],
    }).includes("unexpected_field"),
  );
  assert.ok(codes({ ...base, moves: [{ move: "choice", worked: 1, not_worked: 0, extra: 1 }] }).includes("unexpected_field"));
});

test("rejects id-like fields and does not treat them as ordinary extras only", () => {
  for (const field of ["user_id", "userId", "device_id", "deviceId", "install_id", "ip", "ip_address", "email", "kid_id", "revenuecat_id"]) {
    const issues = codes({ ...base, [field]: "abc" });
    assert.ok(issues.includes("id_like_field"), field);
  }
  const nested = validateInsight({
    ...base,
    situations: [{ type: "siblings", great: 0, better: 1, same: 0, worse: 0, unrated: 0, device_id: "xyz" }],
  });
  assert.equal(nested.ok, false);
  if (!nested.ok) assert.ok(nested.issues.some((issue) => issue.code === "id_like_field" && issue.path.endsWith("device_id")));
});

test("rejects dates and non-weeks in period_key, and counts or text over the cap", () => {
  assert.equal(isIsoWeekKey("2026-W44"), true);
  assert.equal(isIsoWeekKey("2026-W53"), true);
  assert.equal(isIsoWeekKey("2021-W53"), false);
  assert.ok(codes({ ...base, period_key: "2026-11-01" }).includes("invalid_period_key"));
  assert.ok(codes({ ...base, period_key: "2021-W53" }).includes("invalid_period_key"));
  assert.ok(codes({ ...base, period_key: "2026-W00" }).includes("invalid_period_key"));
  assert.ok(codes({ ...base, app_version: "1.0.3" }).includes("invalid_app_version"));
  assert.ok(
    codes({
      ...base,
      situations: [{ type: "eating", great: 31, better: 0, same: 0, worse: 0, unrated: 0 }],
    }).includes("count_out_of_range"),
  );
  assert.ok(
    codes({
      ...base,
      situations: [{ type: "eating", great: -1, better: 0, same: 0, worse: 0, unrated: 0 }],
    }).includes("count_out_of_range"),
  );
  assert.ok(codes({ ...base, free_text: "א".repeat(501) }).includes("text_too_long"));
  assert.ok(codes({ ...base, free_text: "hello", free_text_scrubbed: false }).includes("scrub_not_confirmed"));
  assert.ok(codes({ ...base, schema_v: 2 }).includes("unsupported_schema"));
});

test("scrubs patterned contact data and does not keep it in the stored text", () => {
  const raw = "email me a@b.co or 050-123-4567 +972501112233 see https://secret.example/a id 123456789 on 2026-11-01";
  const result = validateInsight({ ...base, free_text: raw });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.free_text?.includes("a@b.co"), false);
  assert.equal(result.value.free_text?.includes("050"), false);
  assert.equal(result.value.free_text?.includes("secret.example"), false);
  assert.equal(result.value.free_text?.includes("123456789"), false);
  assert.equal(result.value.free_text?.includes("2026-11-01"), false);
  assert.match(result.value.free_text ?? "", /\[email\]/);
  assert.match(scrubFreeText("www.kidsit.ai/x"), /\[url\]/);
});

test("expiry stays on the Sunday of the submission week plus 90 days", () => {
  assert.equal(freeTextExpiresOn(new Date("2026-11-01T23:00:00.000Z")), "2027-01-30");
  assert.equal(freeTextExpiresOn(new Date("2026-11-02T00:30:00.000Z")), "2027-02-06");
});

test("insert statement keeps identifiers out of the column list and out of the SQL text", () => {
  const forbidden = ["ip", "user_id", "device_id", "created_at", "user_agent", "install_id"];
  for (const column of SUBMISSION_COLUMNS) assert.equal(forbidden.includes(column), false);

  const validated = validateInsight({ ...base, free_text: "o'hara kid@mail.com" });
  assert.equal(validated.ok, true);
  if (!validated.ok) return;
  const { text, params } = buildInsertStatement(validated.value);
  assert.equal(text.includes("ip"), false);
  assert.equal(text.includes("created_at"), false);
  assert.equal(text.includes("kid@mail.com"), false);
  assert.equal(text.includes("o'hara"), false);
  assert.ok(params.includes(validated.value.free_text));
  assert.equal(params.filter((item) => item === "bedtime_sleep").length, 1);
});

test("CORS allows the Capacitor origins and rejects other sites", () => {
  assert.equal(isAllowedInsightOrigin("capacitor://localhost"), true);
  assert.equal(isAllowedInsightOrigin("https://localhost"), true);
  assert.equal(isAllowedInsightOrigin("http://localhost"), true);
  assert.equal(isAllowedInsightOrigin("http://localhost:3000"), true);
  assert.equal(isAllowedInsightOrigin("https://localhost:8100"), true);
  assert.equal(isAllowedInsightOrigin("https://kidsit.ai"), false);
  assert.equal(isAllowedInsightOrigin("http://127.0.0.1"), false);
  assert.equal(isAllowedInsightOrigin("https://evil.localhost"), false);
  assert.equal(isAllowedInsightOrigin("capacitor://evil"), false);
});

test("middleware excludes api from the locale rewrite", () => {
  const src = readFileSync(new URL("../../middleware.ts", import.meta.url), "utf8");
  assert.match(src, /\/\(\(\?!_next\/\|api\/\|he\/\|he\$\|en\/\|en\$\|/);
  assert.match(src, /shouldBypassLocale\(pathname\)/);
  const matcher = /^\/((?!_next\/|api\/|he\/|he$|en\/|en$|.*\.).*)$/;
  assert.equal(matcher.test("/api/insights"), false);
  assert.equal(matcher.test("/api/insights/purge"), false);
  assert.equal(matcher.test("/privacy"), true);
  assert.equal(matcher.test("/en/privacy"), false);
  assert.equal(matcher.test("/favicon.ico"), false);
});

test("stored row has no echoed id field from the client", () => {
  const result = validateInsight(base);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const value: ValidatedInsight = result.value;
  assert.equal("id" in value, false);
  assert.equal("user_id" in value, false);
});
