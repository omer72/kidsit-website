import assert from "node:assert/strict";
import test from "node:test";
import { EXTRA_PROVIDERS, GA4_PROVIDER, GSC_PROVIDER } from "./providers";

test("GA4 and Search Console show 'not connected' with the missing env vars", async () => {
  assert.deepEqual(await GA4_PROVIDER.load({}), { state: "not_connected", missing: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID"] });
  assert.deepEqual(await GSC_PROVIDER.load({ GOOGLE_SERVICE_ACCOUNT_JSON: "{}" }), { state: "not_connected", missing: ["GSC_SITE_URL"] });
});

test("configured but unimplemented providers still say not connected, never fake data", async () => {
  const env = { GOOGLE_SERVICE_ACCOUNT_JSON: "{}", GA4_PROPERTY_ID: "123", GSC_SITE_URL: "sc-domain:example.com" };
  for (const p of EXTRA_PROVIDERS) {
    const r = await p.load(env);
    assert.equal(r.state, "not_connected");
    if (r.state === "not_connected") assert.deepEqual(r.missing, []);
  }
});
