import assert from "node:assert/strict";
import test from "node:test";
import { validateComment } from "./validate";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({ lang: "he", slug: "milchamot-shena", name: "דנה", body: "תודה!", ...fields })) f.set(k, v);
  return f;
};

test("comment: name and body are enough; empty email becomes null", () => {
  assert.deepEqual(validateComment(form({ name: "  דנה ", email: "" })), {
    ok: true,
    value: { lang: "he", slug: "milchamot-shena", name: "דנה", email: null, body: "תודה!" },
  });
});

test("comment: optional email is kept when valid", () => {
  const r = validateComment(form({ email: "a@b.co" }));
  assert.ok(r.ok && r.value.email === "a@b.co");
});

test("comment: rejections", () => {
  const err = (f: Record<string, string>) => {
    const r = validateComment(form(f));
    return r.ok ? null : r.error;
  };
  assert.equal(err({ name: "   " }), "name");
  assert.equal(err({ name: "x".repeat(81) }), "name");
  assert.equal(err({ body: "" }), "body");
  assert.equal(err({ body: "x".repeat(2001) }), "body");
  assert.equal(err({ email: "not-an-email" }), "email");
  assert.equal(err({ lang: "fr" }), "post");
  assert.equal(err({ slug: "../etc" }), "post");
  assert.equal(err({ confirm_url: "http://spam" }), "spam");
});
