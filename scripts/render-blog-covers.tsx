/**
 * Rasterize blog share cards into public/og/<lang>/<slug>.png.
 *
 * Satori does not run Unicode bidi, so Hebrew lines go through visualOrder()
 * inside renderBlogCoverPng and are right-aligned. English stays centered.
 *
 * Usage: npx tsx scripts/render-blog-covers.tsx he/preida-bagan he/kibui-masach
 * With no arguments, rewrites the Hebrew cards whose committed pixels were
 * letter-reversed or centered instead of right-aligned.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderBlogCoverPng } from "../src/lib/blog-cover";
import type { TextDir } from "../src/lib/rtl-visual";

const ROOT = join(import.meta.dirname, "..");

/**
 * Logical title lines for cards this script rewrites. Other covers in
 * public/og were already in visual order and right-aligned; they are left
 * as committed. Add a key here before regenerating another card.
 * OUT_DIR writes previews instead of public/og.
 */
const COVERS: Record<string, { dir: TextDir; lines: string[] }> = {
  "he/preida-bagan": {
    dir: "rtl",
    lines: ["ילד בוכה בפרידה בגן?", "משפט פרידה קצר שעובד בבוקר"],
  },
  "he/kibui-masach": {
    dir: "rtl",
    lines: ["הילד מתפרק כשמכבים את המסך?", "מה אומרים לפני, בזמן ואחרי"],
  },
};

const AFFECTED = ["he/preida-bagan", "he/kibui-masach"];

async function fontFor(text: string): Promise<ArrayBuffer> {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=Fredoka:wght@600&text=${encodeURIComponent(text)}`)
  ).text();
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error("Fredoka was not found");
  return (await fetch(url)).arrayBuffer();
}

async function main() {
  const keys = process.argv.slice(2);
  const selected = keys.length > 0 ? keys : AFFECTED;
  for (const key of selected) {
    if (!COVERS[key]) throw new Error(`no cover copy for ${key}`);
  }
  const icon = `data:image/png;base64,${(await readFile(join(ROOT, "public/icon-512.png"))).toString("base64")}`;
  const sample = selected.map((key) => ["Kidsit blog בלוג", ...COVERS[key].lines].join("")).join("");
  const font = await fontFor(sample);
  for (const key of selected) {
    const cover = COVERS[key];
    const png = await renderBlogCoverPng({ ...cover, font, icon });
    const dest = process.env.OUT_DIR
      ? join(process.env.OUT_DIR, `${key.replace("/", "-")}.png`)
      : join(ROOT, "public/og", `${key}.png`);
    await writeFile(dest, png);
    console.log(`wrote ${dest} (${png.length} bytes)`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
