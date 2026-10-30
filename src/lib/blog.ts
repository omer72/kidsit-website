import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import { storeUrl } from "@/dictionaries";

/** Rewrite bare App Store / Play links to the same he_ ct/UTM scheme as the HE landing page (placement "blog"). */
function withStoreUtms(html: string): string {
  const apple = storeUrl.apple("blog", "he");
  const play = storeUrl.play("blog", "he");
  return html
    .replace(/https:\/\/apps\.apple\.com\/[^"\s<]+/g, apple)
    .replace(/https:\/\/play\.google\.com\/store\/apps\/details\?id=ai\.kidsit\.app[^"\s<]*/g, play);
}


export type PostMeta = {
  slug: string; // path segment, e.g. hetkefei-zaam-gil-3
  path: string; // /he/blog/hetkefei-zaam-gil-3
  titleTag: string;
  title: string; // H1 from body
  description: string;
  date: string; // YYYY-MM-DD
};

export type FaqItem = { q: string; a: string };

export type Post = PostMeta & { bodyMd: string; html: string; faq: FaqItem[] };

const DIR = join(process.cwd(), "content/blog/he");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { meta: {}, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const meta: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    meta[k] = v;
  }
  return { meta, body };
}

function h1(body: string): string {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

marked.setOptions({ gfm: true, breaks: false });

const FAQ_BLOCK = /<!--\s*faq\s*(\[[\s\S]*?\])\s*-->/;

/** Replace a <!-- faq [...] --> block with the same Q&A as visible markdown, so JSON-LD cannot drift. */
function expandFaq(body: string): { body: string; faq: FaqItem[] } {
  const m = body.match(FAQ_BLOCK);
  if (!m) return { body, faq: [] };
  let faq: FaqItem[];
  try {
    faq = JSON.parse(m[1]) as FaqItem[];
  } catch (err) {
    throw new Error(`Invalid FAQ JSON in blog post: ${(err as Error).message}`);
  }
  const valid =
    Array.isArray(faq) &&
    faq.every((item) => item && typeof item.q === "string" && typeof item.a === "string" && item.q.trim() && item.a.trim());
  if (!valid) throw new Error("Blog FAQ JSON must be an array of {q, a} strings");
  const rendered = faq.map((item) => `**${item.q}**\n\n${item.a}`).join("\n\n");
  return { body: body.replace(m[0], rendered), faq };
}

function loadFile(file: string): Post {
  const raw = readFileSync(join(DIR, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const path = meta.slug || `/he/blog/${file.replace(/\.md$/, "")}`;
  const slug = path.replace(/^\/he\/blog\//, "");
  const expanded = expandFaq(body);
  // Strip the leading H1 from HTML body (rendered separately as page title) but keep it in bodyMd for diff checks.
  // Frontmatter parsing can leave a blank line, so the heading is not always at column 0.
  const bodyWithoutH1 = expanded.body.replace(/^\s*#\s+.+(?:\n+|$)/, "");
  const html = withStoreUtms(marked.parse(bodyWithoutH1, { async: false }) as string);
  return {
    slug,
    path,
    titleTag: meta.title_tag || h1(expanded.body),
    title: h1(expanded.body),
    description: meta.meta_description || "",
    date: meta.date || "2026-10-19",
    bodyMd: expanded.body,
    html,
    faq: expanded.faq,
  };
}

export function listPosts(): PostMeta[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const p = loadFile(f);
      return { slug: p.slug, path: p.path, titleTag: p.titleTag, title: p.title, description: p.description, date: p.date };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getPost(slug: string): Post | null {
  const file = `${slug}.md`;
  try {
    return loadFile(file);
  } catch {
    return null;
  }
}

export function allSlugs(): string[] {
  return listPosts().map((p) => p.slug);
}
