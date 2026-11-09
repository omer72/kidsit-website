import assert from "node:assert/strict";
import { createVerify } from "node:crypto";
import test from "node:test";
import { clearTokenCache, getAccessToken, GoogleApiError, parseServiceAccount, SCOPE_GSC, signJwt } from "./google-auth";
import { fakeGoogle, json, TEST_EMAIL, TEST_PEM, TEST_PUBLIC, testServiceAccountJson } from "./google-test-helpers";

const noLeak = (s: string) => {
  assert.ok(!s.includes("PRIVATE KEY"), "no PEM header");
  assert.ok(!s.includes(TEST_PEM.split("\n")[1]), "no key material");
};

test("parseServiceAccount rejects missing, bad JSON, wrong type, bad email, missing or broken key — without echoing values", () => {
  const cases: [string | undefined, RegExp][] = [
    [undefined, /חסר/],
    ["{not json", /אינו JSON תקין/],
    ["[1]", /client_email/],
    [testServiceAccountJson({ type: "authorized_user" }), /service_account/],
    [testServiceAccountJson({ client_email: "someone@gmail.com" }), /client_email/],
    [testServiceAccountJson({ private_key: undefined }), /private_key/],
    [testServiceAccountJson({ private_key: "-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n" }), /לא נקרא/],
  ];
  for (const [raw, re] of cases) {
    const r = parseServiceAccount(raw);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.error, re);
      noLeak(r.error);
    }
  }
});

test("parseServiceAccount accepts a real key file, also with escaped \\n", () => {
  const a = parseServiceAccount(testServiceAccountJson());
  assert.ok(a.ok && a.sa.clientEmail === TEST_EMAIL);
  const escaped = testServiceAccountJson({ private_key: TEST_PEM.replace(/\n/g, "\\n") });
  const b = parseServiceAccount(escaped);
  assert.ok(b.ok);
  if (a.ok && b.ok) assert.equal(a.sa.fingerprint, b.sa.fingerprint);
  if (a.ok) assert.match(a.sa.fingerprint, /^[0-9a-f]{12}$/);
});

test("signJwt makes an RS256 JWT with the documented claims and a valid signature", () => {
  const p = parseServiceAccount(testServiceAccountJson());
  assert.ok(p.ok);
  if (!p.ok) return;
  const jwt = signJwt(p.sa, SCOPE_GSC, 1_800_000_000);
  const [h, c, sig] = jwt.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(h, "base64url").toString()), { alg: "RS256", typ: "JWT" });
  assert.deepEqual(JSON.parse(Buffer.from(c, "base64url").toString()), {
    iss: TEST_EMAIL,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: 1_800_000_000,
    exp: 1_800_003_600,
  });
  assert.ok(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(TEST_PUBLIC, Buffer.from(sig, "base64url")));
});

test("getAccessToken exchanges the JWT once and reuses the token until near expiry", async () => {
  clearTokenCache();
  const p = parseServiceAccount(testServiceAccountJson());
  assert.ok(p.ok);
  if (!p.ok) return;
  const g = fakeGoogle(() => json(500, {}));
  const now = Date.UTC(2026, 10, 9, 12);
  assert.equal(await getAccessToken(p.sa, SCOPE_GSC, g.fetchImpl, now), "ya29.test-token");
  assert.equal(await getAccessToken(p.sa, SCOPE_GSC, g.fetchImpl, now + 30 * 60_000), "ya29.test-token");
  assert.equal(g.calls.length, 1);
  const form = new URLSearchParams(g.calls[0].body as string);
  assert.equal(form.get("grant_type"), "urn:ietf:params:oauth:grant-type:jwt-bearer");
  assert.equal(form.get("assertion")?.split(".").length, 3);
  assert.equal(g.calls[0].init?.method, "POST");
  await getAccessToken(p.sa, SCOPE_GSC, g.fetchImpl, now + 59 * 60_000); // within 2 min of expiry → new exchange
  assert.equal(g.calls.length, 2);
});

test("token errors give a short, safe message (status + sanitized error code only)", async () => {
  clearTokenCache();
  const p = parseServiceAccount(testServiceAccountJson());
  assert.ok(p.ok);
  if (!p.ok) return;
  const g = fakeGoogle(() => json(500, {}), json(400, { error: "invalid_grant<script>", error_description: TEST_PEM }));
  await assert.rejects(getAccessToken(p.sa, SCOPE_GSC, g.fetchImpl), (e: unknown) => {
    assert.ok(e instanceof GoogleApiError);
    assert.match(e.message, /HTTP 400, invalid_grantscript/);
    noLeak(e.message);
    return true;
  });
  const down = { fetchImpl: async () => { throw new Error("ECONNRESET " + TEST_PEM); } };
  await assert.rejects(getAccessToken(p.sa, SCOPE_GSC, down.fetchImpl), (e: unknown) => {
    assert.ok(e instanceof GoogleApiError);
    noLeak((e as Error).message);
    return true;
  });
});
