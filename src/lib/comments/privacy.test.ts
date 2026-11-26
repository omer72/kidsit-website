import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const privacy = readFileSync(join(root, "src/app/[lang]/privacy/page.tsx"), "utf8");
const form = readFileSync(join(root, "src/components/blog-comment-form.tsx"), "utf8");
const legal = readFileSync(join(root, "src/components/legal.tsx"), "utf8");
const flat = (s: string) => s.replace(/\s+/g, " ");

test("comment form: HE and EN privacy sentence links to the comments section of the policy", () => {
  assert.match(form, /מדיניות הפרטיות/);
  assert.match(form, /privacy policy/);
  assert.match(form, /href=\{`\/\$\{lang\}\/privacy#comments`\}/);
  assert.equal(form.includes("href={`/${lang}/privacy`}"), false);
  assert.match(form, /name="confirm_url"/);
});

test("privacy page: comments section matches the current form (name + email, no phone)", () => {
  assert.equal((privacy.match(/id: "comments"/g) ?? []).length, 2);
  assert.match(legal, /<section key=\{s\.id\} id=\{s\.id\}/);
  const p = flat(privacy);
  assert.match(p, /We collect your name \(required\) and your email address \(optional\)\. We do not collect a phone number\./);
  assert.match(p, /Your email is never shown on the site/);
  assert.match(p, /site administrator approves it/);
  assert.match(p, /ask us to access, correct, or delete a comment, email \{mail\}/);
  assert.match(p, /אנו אוספים את השם \(חובה\) ואת כתובת האימייל \(לא חובה\)\. איננו אוספים מספר טלפון\./);
  assert.match(p, /האימייל אינו מוצג באתר/);
  assert.match(p, /מנהל האתר מאשר אותה/);
  assert.match(p, /עיון, תיקון או מחיקה של תגובה, כתבו אלינו לכתובת \{mail\}/);
  assert.equal(/We collect a phone number/i.test(p), false);
  assert.equal(/אנו אוספים מספר טלפון/.test(p), false);
});

test("legal-prose max-width is font-independent rem, not ch (hash-scroll stability)", () => {
  const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
  const start = css.indexOf(".legal-prose {");
  const blog = css.indexOf(".blog-prose {");
  assert.ok(start >= 0 && blog > start);
  const legalBlock = css.slice(start, blog);
  assert.match(legalBlock, /max-width:\s*35\.1rem/);
  assert.match(legalBlock, /html\[lang="he"\] \.legal-prose[\s\S]*max-width:\s*37\.15rem/);
  assert.equal(/max-width:\s*[^;]*ch/.test(legalBlock), false);
});

test("Hebrew fonts are preloaded on /he (not preload: false)", () => {
  const fontsHe = readFileSync(join(root, "src/app/[lang]/fonts-he.ts"), "utf8");
  assert.equal(/preload:\s*false/.test(fontsHe), false);
});
