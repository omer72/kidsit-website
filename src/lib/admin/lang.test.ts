import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { shouldBypassLocale } from "../locale-bypass";
import { buildFunnelData, FUNNEL_ENTRY_LABELS, FUNNEL_ENTRY_LABELS_EN, FUNNEL_PROVIDER, FUNNEL_STEP_LABELS, FUNNEL_STEP_LABELS_EN } from "./funnel";
import { ConfigError } from "./google-auth";
import { fakeGoogle, json, testServiceAccountJson } from "./google-test-helpers";
import { isLang, localeOf, parseLang, statsPath, tr } from "./lang";
import { loadMeta, metaErrorMessage, resolveMetaConfig } from "./meta";
import { GA4_PROVIDER, GSC_PROVIDER, STATS_PROVIDERS, providerTitle, runProvider, safeErrorMessage } from "./providers";
import { describeHttpError, loadRevenueCat, mapSegmentTotals } from "./revenuecat";

const HEBREW = /[\u0590-\u05FF]/;
const NOW = new Date("2026-11-11T12:00:00Z");
const SA = testServiceAccountJson();
const noHebrew = (label: string, value: unknown) => assert.ok(!HEBREW.test(JSON.stringify(value)), `${label} still has Hebrew: ${JSON.stringify(value).slice(0, 200)}`);

test("lang helpers: only 'en' selects English, everything else is Hebrew", () => {
  assert.equal(parseLang("en"), "en");
  for (const x of ["he", "EN", "", null, undefined, "en ", 5]) assert.equal(parseLang(x), "he");
  assert.ok(isLang("he") && isLang("en") && !isLang("fr"));
  assert.equal(tr("he", "א", "a"), "א");
  assert.equal(tr("en", "א", "a"), "a");
  assert.equal(localeOf("he"), "he-IL");
  assert.equal(localeOf("en"), "en-US");
  assert.equal(statsPath("he"), "/admin/stats");
  assert.equal(statsPath("en"), "/admin/stats/en");
});

test("number formatting follows the language (he-IL vs en-US)", () => {
  assert.equal(new Intl.NumberFormat(localeOf("en")).format(1234567), "1,234,567");
  const rows = [{ step: "onboarding_done", platform: "ios", source: "", n: 1234 }];
  assert.equal(buildFunnelData(rows, NOW, [], "en").totals[0].value, "1,234");
  assert.equal(buildFunnelData(rows, NOW, [], "he").totals[0].value, new Intl.NumberFormat("he-IL").format(1234));
});

test("funnel: English has no Hebrew anywhere, Hebrew output is unchanged by default", () => {
  const rows = [
    { step: "onboarding_done", platform: "ios", source: "", n: 20 },
    { step: "paywall_shown", platform: "android", source: "kidsit.ai", n: 6 },
  ];
  const entries = [{ entry: "first_moment", platform: "ios", n: 2 }];
  const en = buildFunnelData(rows, NOW, entries, "en");
  noHebrew("funnel en", en);
  assert.equal(en.tables[0].rows[0][0], FUNNEL_STEP_LABELS_EN.onboarding_done);
  assert.equal(en.tables[1].rows[0][0], "(unknown)");
  assert.equal(en.tables[2].rows[0][0], FUNNEL_ENTRY_LABELS_EN.first_moment);
  assert.match(en.tables[2].rows[1][0], /not reported/);
  const empty = buildFunnelData([], NOW, [], "en");
  noHebrew("funnel en empty", empty);
  assert.equal(empty.tables[0].empty, "No data yet.");
  // default = Hebrew, identical to explicit "he"
  assert.deepEqual(buildFunnelData(rows, NOW, entries), buildFunnelData(rows, NOW, entries, "he"));
  assert.equal(buildFunnelData(rows, NOW, entries).tables[0].rows[0][0], FUNNEL_STEP_LABELS.onboarding_done);
});

test("funnel label maps cover the same keys in both languages", () => {
  assert.deepEqual(Object.keys(FUNNEL_STEP_LABELS_EN).sort(), Object.keys(FUNNEL_STEP_LABELS).sort());
  assert.deepEqual(Object.keys(FUNNEL_ENTRY_LABELS_EN).sort(), Object.keys(FUNNEL_ENTRY_LABELS).sort());
  for (const v of [...Object.values(FUNNEL_STEP_LABELS_EN), ...Object.values(FUNNEL_ENTRY_LABELS_EN)]) assert.ok(!HEBREW.test(v));
});

test("every provider has an English title and no Hebrew in it", () => {
  for (const p of STATS_PROVIDERS) {
    assert.ok(p.titleEn && !HEBREW.test(p.titleEn), p.id);
    assert.equal(providerTitle(p, "en"), p.titleEn);
    assert.equal(providerTitle(p, "he"), p.title);
  }
});

test("GSC + GA4 data cards in English: labels, dates, notes, link label", async () => {
  const g = fakeGoogle((url) => {
    if (url.includes("webmasters")) {
      return json(200, { rows: [{ keys: ["query one"], clicks: 1234, impressions: 5000, ctr: 0.247, position: 3.14 }] });
    }
    return json(200, { rows: [{ dimensionValues: [{ value: "/he/blog/x" }], metricValues: [{ value: "1234" }] }], totals: [{ metricValues: [{ value: "1234" }] }], rowCount: 40 });
  });
  const gsc = await runProvider(GSC_PROVIDER, { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GSC_SITE_URL: "https://kidsit.ai/" }, g.fetchImpl, NOW, "en");
  assert.equal(gsc.state, "ok");
  noHebrew("gsc en", gsc);
  if (gsc.state === "ok") {
    assert.match(gsc.range, /^\d\d\/\d\d\/\d{4}–\d\d\/\d\d\/\d{4} \(28 days, Pacific Time\)$/);
    assert.equal(gsc.totals[0].value, "1,234");
    assert.deepEqual(gsc.tables[0].columns, ["Query", "Clicks", "Impressions", "CTR", "Position"]);
    assert.equal(gsc.link?.href, "/admin/stats/gsc-weekly.csv");
  }
  const ga = await runProvider(GA4_PROVIDER, { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GA4_PROPERTY_ID: "123456789" }, g.fetchImpl, NOW, "en");
  assert.equal(ga.state, "ok");
  noHebrew("ga4 en", ga);
  if (ga.state === "ok") assert.match(ga.note ?? "", /Showing 1 of 40 pages\./);
});

test("provider errors in English: config, HTTP and unknown errors", async () => {
  const f = async () => json(200, {});
  for (const env of [
    { GOOGLE_SERVICE_ACCOUNT_JSON: "{oops", GSC_SITE_URL: "https://kidsit.ai/" },
    { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GSC_SITE_URL: "sc-domain:kidsit.ai" },
    { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GSC_SITE_URL: "https://kidsit.ai" },
  ]) {
    const r = await runProvider(GSC_PROVIDER, env, f, NOW, "en");
    assert.ok(r.state === "error");
    noHebrew("gsc config error", r);
    // the Hebrew message for the same input is still Hebrew
    const he = await runProvider(GSC_PROVIDER, env, f, NOW);
    assert.ok(he.state === "error" && HEBREW.test(he.error));
  }
  const b = await runProvider(GA4_PROVIDER, { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GA4_PROPERTY_ID: "G-ABC" }, f, NOW, "en");
  assert.ok(b.state === "error" && /Measurement ID/.test(b.error));
  for (const status of [401, 403, 404, 429, 500]) {
    const g = fakeGoogle(() => json(status, {}));
    const r = await runProvider(GSC_PROVIDER, { GOOGLE_SERVICE_ACCOUNT_JSON: SA, GSC_SITE_URL: "https://kidsit.ai/" }, g.fetchImpl, NOW, "en");
    assert.ok(r.state === "error", String(status));
    noHebrew(`gsc http ${status}`, r);
  }
  assert.equal(safeErrorMessage(new Error("boom"), "en"), "Loading the data failed.");
  assert.equal(safeErrorMessage(new Error("unexpected x"), "en"), "Unexpected response format from Google.");
  assert.equal(safeErrorMessage(new ConfigError("עברית", "english"), "en"), "english");
  assert.equal(safeErrorMessage(new ConfigError("עברית", "english")), "עברית");
});

test("funnel provider: missing table error is English in en", async () => {
  // not connected without DATABASE_URL, same in both languages
  assert.deepEqual(await runProvider(FUNNEL_PROVIDER, {}, undefined, NOW, "en"), { state: "not_connected", missing: ["DATABASE_URL"] });
});

test("RevenueCat in English: errors and segment fallback label", async () => {
  for (const s of [401, 403, 404, 429, 500]) {
    assert.ok(!HEBREW.test(describeHttpError(s, "en")), String(s));
    assert.ok(HEBREW.test(describeHttpError(s)), String(s));
  }
  const body = { summary: { total: { " ": { 0: 3 }, iOS: { 0: 5 } } } };
  assert.deepEqual(mapSegmentTotals(body, "en"), [{ label: "iOS", value: 5 }, { label: "(no value)", value: 3 }]);
  assert.equal(mapSegmentTotals(body)[1].label, "(ללא ערך)");
  const bad = await loadRevenueCat({ REVENUECAT_SECRET_KEY: "fake-key", REVENUECAT_PROJECT_ID: "nope" }, async () => json(200, {}), NOW, "en");
  assert.equal(bad.state, "invalid_config");
  noHebrew("rc invalid config", bad);
  const down = await loadRevenueCat({ REVENUECAT_SECRET_KEY: "fake-key" }, async () => json(403, {}), NOW, "en");
  assert.equal(down.state, "ok");
  noHebrew("rc 403", down);
  const net = await loadRevenueCat({ REVENUECAT_SECRET_KEY: "fake-key" }, async () => { throw new Error("secret detail"); }, NOW, "en");
  noHebrew("rc network", net);
  assert.ok(!JSON.stringify(net).includes("secret detail"));
});

test("Meta in English: config errors, graph errors, account status", async () => {
  for (const [env, re] of [
    [{ META_ACCESS_TOKEN: "fake-token-1234", META_PIXEL_ID: "abc" }, /META_PIXEL_ID/],
    [{ META_ACCESS_TOKEN: "fake-token-1234", META_AD_ACCOUNT_ID: "zzz" }, /META_AD_ACCOUNT_ID/],
    [{ META_ACCESS_TOKEN: "fake-token-1234", META_GRAPH_VERSION: "25" }, /META_GRAPH_VERSION/],
  ] as const) {
    const r = resolveMetaConfig(env, "en");
    assert.ok(!r.ok && re.test(r.error ?? "") && !HEBREW.test(r.error ?? ""));
  }
  const cases: [number, number | null, number | null][] = [[401, 190, 463], [403, 10, null], [400, 100, 33], [429, 4, null], [400, 100, null], [500, null, null]];
  for (const [st, code, sub] of cases) {
    assert.ok(!HEBREW.test(metaErrorMessage(st, code, sub, "en")), `${st}/${code}`);
    assert.ok(HEBREW.test(metaErrorMessage(st, code, sub)), `${st}/${code} he`);
  }
  const env = { META_ACCESS_TOKEN: "fake-token-1234", META_PIXEL_ID: "2535446663629392", META_AD_ACCOUNT_ID: "137780457" };
  const failing = await loadMeta(env, async () => json(400, { error: { code: 190 } }), NOW, "en");
  noHebrew("meta 190", failing);
  const ok = await loadMeta(
    env,
    async (url) => (url.includes("act_") ? json(200, { name: "Ads", account_status: 2 }) : json(200, { name: "Pixel", last_fired_time: "2026-11-09T10:12:00+0000" })),
    NOW,
    "en",
  );
  noHebrew("meta ok", ok);
  assert.ok(ok.state === "ok" && ok.adAccount?.ok && ok.adAccount.data.status === "Disabled");
  const he = await loadMeta(env, async (url) => (url.includes("act_") ? json(200, { account_status: 2 }) : json(200, { name: "Pixel" })), NOW);
  assert.ok(he.state === "ok" && he.adAccount?.ok && he.adAccount.data.status === "מושבת");
  const down = await loadMeta(env, async () => { throw new Error("fake-token-1234"); }, NOW, "en");
  noHebrew("meta network", down);
  assert.ok(!JSON.stringify(down).includes("fake-token-1234"));
});

// --- routing / protection: source-level checks (the pages are async server components, so no render here) ---
const read = (p: string) => readFileSync(new URL(`../../app/admin/${p}`, import.meta.url), "utf8");

test("/admin/stats/en is bypassed by the locale middleware like /admin/stats", () => {
  assert.equal(shouldBypassLocale("/admin/stats/en"), true);
  assert.equal(shouldBypassLocale("/admin/stats"), true);
});

test("EN and HE routes render the same password-gated StatsPage, in the right direction", () => {
  const he = read("(he)/stats/page.tsx");
  const en = read("(en)/stats/en/page.tsx");
  assert.match(he, /<StatsPage lang="he"/);
  assert.match(en, /<StatsPage lang="en"/);
  for (const src of [he, en]) {
    assert.match(src, /export const dynamic = "force-dynamic"/);
    assert.match(src, /robots: \{ index: false, follow: false \}/);
  }
  const root = read("_stats/AdminRoot.tsx");
  assert.match(root, /<html lang=\{lang\} dir=\{lang === "en" \? "ltr" : "rtl"\}>/);
  assert.match(read("(he)/layout.tsx"), /<AdminRoot lang="he">/);
  assert.match(read("(en)/layout.tsx"), /<AdminRoot lang="en">/);
  for (const l of ["(he)/layout.tsx", "(en)/layout.tsx"]) assert.match(read(l), /robots: \{ index: false, follow: false, nocache: true/);
});

test("the shared page checks the session before loading any data, for both languages", () => {
  const src = read("_stats/StatsPage.tsx");
  const gate = src.indexOf("verifySessionToken(");
  const secretCheck = src.indexOf("configuredSecret(process.env.STATS_PASSWORD)");
  const dataLoad = src.indexOf("getRevenueCat(lang)", src.indexOf("export async function StatsPage"));
  assert.ok(secretCheck > 0 && gate > secretCheck && dataLoad > gate);
  assert.match(src, /statsPath\(other\)/); // visible toggle link
  assert.match(src, /<input type="hidden" name="lang" value=\{lang\} \/>/);
});

test("login/logout keep the language and still use the same session cookie + password check", () => {
  const src = read("_stats/actions.ts");
  assert.match(src, /verifyPassword\(formData\.get\("password"\), secret\)/);
  assert.match(src, /redirect\(`\$\{statsPath\(lang\)\}\?e=1`\)/);
  assert.match(src, /parseLang\(formData\.get\("lang"\)\)/);
  assert.match(src, /createSessionToken\(secret as string\), sessionCookieOptions/);
});

test("no Meta /{pixel}/stats call anywhere in the admin libs", () => {
  const meta = readFileSync(new URL("./meta.ts", import.meta.url), "utf8");
  assert.ok(!/\/stats["'`]|pixelId\}\/stats|"stats"/.test(meta.replace(/^\/\/.*$/gm, "")));
});

// --- QA round: thousands separators, ?lang=en redirect, toggle size ---
import { englishRedirectTarget, fmtInt } from "./lang";

test("fmtInt: thousands separators per language", () => {
  assert.equal(fmtInt(1234567, "en"), "1,234,567");
  assert.equal(fmtInt(1234567, "he"), new Intl.NumberFormat("he-IL").format(1234567));
  assert.equal(fmtInt(1234, "he"), "1,234");
  assert.equal(fmtInt(999, "en"), "999");
  assert.equal(fmtInt(0, "en"), "0");
});

test("series totals and bar tooltips use fmtInt (not raw numbers)", () => {
  const src = read("_stats/StatsPage.tsx");
  assert.match(src, /<b className="tabular-nums">\{fmtInt\(total, lang\)\}<\/b>/);
  assert.match(src, /\$\{fmtDay\(p\.date, lang\)\}: \$\{fmtInt\(p\.value, lang\)\}/);
  assert.ok(!/<b className="tabular-nums">\{total\}<\/b>/.test(src));
  assert.ok(!/: \$\{p\.value\}/.test(src));
});

test("?lang=en redirect keeps every other query param and drops only lang", () => {
  assert.equal(englishRedirectTarget({ lang: "en" }), "/admin/stats/en");
  assert.equal(englishRedirectTarget({ lang: "en", e: "1" }), "/admin/stats/en?e=1");
  assert.equal(englishRedirectTarget({ e: "1", lang: "en", utm_source: "a b", x: "é&=" }), "/admin/stats/en?e=1&utm_source=a+b&x=%C3%A9%26%3D");
  assert.equal(englishRedirectTarget({ lang: ["en", "he"], k: ["1", "2"] }), "/admin/stats/en?k=1&k=2");
  assert.equal(englishRedirectTarget({ lang: "he", e: "1" }), null);
  assert.equal(englishRedirectTarget({ e: "1" }), null);
  assert.equal(englishRedirectTarget({}), null);
  assert.match(read("(he)/stats/page.tsx"), /englishRedirectTarget\(searchParams\)/);
});

test("language toggle is a ≥44px touch target", () => {
  const src = read("_stats/StatsPage.tsx");
  const link = src.slice(src.indexOf("href={statsPath(other)}"));
  assert.match(link.slice(0, 400), /min-h-\[44px\]/);
  assert.match(link.slice(0, 400), /min-w-\[44px\]/);
});
