import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The blog index renders /og/<lang>/<slug>.png for every post with no fallback, so a post without a
// cover shows a broken image on /<lang>/blog. Every post needs public/og/<lang>/<slug>.png.
for (const lang of ["he", "en"] as const) {
  test(`every ${lang} blog post has a cover at public/og/${lang}/<slug>.png`, () => {
    const dir = join(process.cwd(), "content/blog", lang);
    const missing: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const fm = readFileSync(join(dir, file), "utf8").match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m);
      const path = fm ? fm[1].trim() : `/${lang}/blog/${file.replace(/\.md$/, "")}`;
      const slug = path.replace(new RegExp(`^/${lang}/blog/`), "");
      if (!existsSync(join(process.cwd(), "public/og", lang, `${slug}.png`))) missing.push(slug);
    }
    assert.deepEqual(missing, [], `missing covers: ${missing.join(", ")}`);
  });
}
