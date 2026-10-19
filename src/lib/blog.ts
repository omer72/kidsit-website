import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";

export type PostMeta = {
  slug: string; // path segment, e.g. hetkefei-zaam-gil-3
  path: string; // /he/blog/hetkefei-zaam-gil-3
  titleTag: string;
  title: string; // H1 from body
  description: string;
  date: string; // YYYY-MM-DD
};

export type Post = PostMeta & { bodyMd: string; html: string };

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

function loadFile(file: string): Post {
  const raw = readFileSync(join(DIR, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const path = meta.slug || `/he/blog/${file.replace(/\.md$/, "")}`;
  const slug = path.replace(/^\/he\/blog\//, "");
  // Strip the leading H1 from HTML body (rendered separately as page title) but keep it in bodyMd for diff checks.
  const bodyWithoutH1 = body.replace(/^#\s+.+\n+/, "");
  const html = marked.parse(bodyWithoutH1, { async: false }) as string;
  return {
    slug,
    path,
    titleTag: meta.title_tag || h1(body),
    title: h1(body),
    description: meta.meta_description || "",
    date: meta.date || "2026-10-19",
    bodyMd: body,
    html,
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
