import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import { dictionaries, storeUrl, type Lang } from "@/dictionaries";
import { storeBadgeArt } from "@/lib/store-badges";
import heSourcesJson from "@/data/he-blog-sources.json";
import enSourcesJson from "@/data/en-blog-sources.json";
import reviewersJson from "@/data/he-blog-reviewers.json";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Official badge markup for a store link already rewritten to this page's campaign URL. */
function storeBadgeHtml(href: string, kind: "apple" | "play", lang: Lang): string {
  const art = storeBadgeArt[lang][kind];
  const labels = dictionaries[lang].stores;
  const alt = kind === "apple" ? labels.appleAlt : labels.playAlt;
  const cls = kind === "apple" ? "store-badge-apple" : "store-badge-play";
  return `<a class="store-badge" href="${href}" aria-label="${alt}"><img class="${cls}" src="${art.src}" alt="${alt}" width="${art.width}" height="${art.height}" /></a>`;
}

/** Rewrite bare App Store / Play links to the page language's ct/UTM scheme (placement "blog") and render them as badges. */
function withStoreUtms(html: string, lang: Lang): string {
  const apple = escapeAttr(storeUrl.apple("blog", lang));
  const play = escapeAttr(storeUrl.play("blog", lang));
  const rewritten = html
    .replace(/https:\/\/apps\.apple\.com\/[^"\s<]+/g, apple)
    .replace(/https:\/\/play\.google\.com\/store\/apps\/details\?id=ai\.kidsit\.app[^"\s<]*/g, play);
  return groupStoreLinkRuns(
    rewritten
      .replace(/<a href="(https:\/\/apps\.apple\.com\/[^"]+)">[\s\S]*?<\/a>/g, (_, href: string) => storeBadgeHtml(href, "apple", lang))
      .replace(/<a href="(https:\/\/play\.google\.com\/store\/apps\/details[^"]+)">[\s\S]*?<\/a>/g, (_, href: string) => storeBadgeHtml(href, "play", lang)),
  );
}

/** One anchor, including an <img>, that does not read past its own closing tag. */
const STORE_ANCHOR = String.raw`<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<\/a>`;

/**
 * Markdown joins store links with " · ". A flex row with gap replaces that dot so a
 * wrap cannot leave a lone separator. Editorial middot lists are left as written.
 * A trailing period stays on the last link.
 */
function groupStoreLinkRuns(html: string): string {
  const runRe = new RegExp(`(?:${STORE_ANCHOR}\\s*·\\s*)+${STORE_ANCHOR}(\\.?)`, "g");
  return html.replace(runRe, (run, dot: string | undefined) => {
    if (!/class="store-badge"|apps\.apple\.com|play\.google\.com\/store\/apps\/details/.test(run)) return run;
    const links = run.match(new RegExp(STORE_ANCHOR, "g"));
    if (!links || links.length < 2) return run;
    const parts: string[] = [];
    let badges: string[] = [];
    const flushBadges = () => {
      if (!badges.length) return;
      parts.push(`<span class="store-link-badges">${badges.join("")}</span>`);
      badges = [];
    };
    links.forEach((link, i) => {
      const suffix = i === links.length - 1 && dot ? "." : "";
      const item = `<span class="store-link-item">${link}${suffix}</span>`;
      if (link.includes('class="store-badge"')) badges.push(item);
      else {
        flushBadges();
        parts.push(item);
      }
    });
    flushBadges();
    return `<span class="store-links">${parts.join("")}</span>`;
  });
}

export type Reviewer = { name: string; credential: string };

/**
 * One verified source. `src/data/he-blog-sources.json` is keyed by slug.
 * Each entry is `{ title, url, publisher?, supports?, checkedAt? }`.
 * Only title, url, and publisher are rendered. `supports` and `checkedAt` stay in the file
 * and are not shown. A missing key or an empty array renders no «מקורות» section.
 * CDC pages (cdc.gov, or CDC / Centers for Disease Control in the title or publisher) are skipped.
 */
export type Source = { title: string; url: string; publisher?: string };

export type PostMeta = {
  slug: string; // path segment, e.g. hetkefei-zaam-gil-3
  path: string; // /he/blog/hetkefei-zaam-gil-3
  titleTag: string;
  title: string; // H1 from body
  description: string;
  date: string; // YYYY-MM-DD, datePublished
  dateModified: string; // YYYY-MM-DD
};

export type FaqItem = { q: string; a: string };

export type Post = PostMeta & {
  bodyMd: string;
  html: string;
  faq: FaqItem[];
  reviewer: Reviewer | null;
  sources: Source[];
};

function dirFor(lang: Lang): string {
  return join(process.cwd(), "content/blog", lang);
}

/** Hebrew/English posts that translate each other. x-default is the English URL, matching the rest of the site. */
const PAIRS: { he: string; en: string }[] = [
  { he: "kibui-masach", en: "screen-time-meltdown" },
  { he: "hadrachat-horim", en: "parent-coaching" },
];

export function blogAlternate(lang: Lang, slug: string): { lang: Lang; slug: string; path: string } | null {
  for (const pair of PAIRS) {
    if (pair[lang] !== slug) continue;
    const other: Lang = lang === "he" ? "en" : "he";
    return { lang: other, slug: pair[other], path: `/${other}/blog/${pair[other]}` };
  }
  return null;
}

export function postLanguageAlternates(
  lang: Lang,
  slug: string,
  selfPath: string,
): { canonical: string; languages?: Record<string, string> } {
  const alt = blogAlternate(lang, slug);
  if (!alt) return { canonical: selfPath };
  const he = lang === "he" ? selfPath : alt.path;
  const en = lang === "en" ? selfPath : alt.path;
  return { canonical: selfPath, languages: { he, en, "x-default": en } };
}

export function blogIndexAlternates(lang: Lang): { canonical: string; languages: Record<string, string> } {
  return {
    canonical: `/${lang}/blog`,
    languages: { he: "/he/blog", en: "/en/blog", "x-default": "/en/blog" },
  };
}

const HE_MONTHS = [
  "בינואר",
  "בפברואר",
  "במרץ",
  "באפריל",
  "במאי",
  "ביוני",
  "ביולי",
  "באוגוסט",
  "בספטמבר",
  "באוקטובר",
  "בנובמבר",
  "בדצמבר",
] as const;

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Hebrew calendar-style date, e.g. 30 באוקטובר 2026. Parses the ISO date, not a timezone-shifted instant. */
export function formatHebrewDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const month = HE_MONTHS[Number(m[2]) - 1];
  const day = Number(m[3]);
  if (!month || day < 1 || day > 31) return iso;
  return `${day} ${month} ${m[1]}`;
}

/** Visible publish/updated date. English uses US order, e.g. November 2, 2026. */
export function formatPostDate(iso: string, lang: Lang): string {
  if (lang === "he") return formatHebrewDate(iso);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const month = EN_MONTHS[Number(m[2]) - 1];
  const day = Number(m[3]);
  if (!month || day < 1 || day > 31) return iso;
  return `${month} ${day}, ${m[1]}`;
}

type RawSource = { title?: string; url?: string; publisher?: string };
type RawReviewer = { name?: string; credential?: string };

const sourcesByLang: Record<Lang, Record<string, RawSource[]>> = {
  he: heSourcesJson as Record<string, RawSource[]>,
  en: enSourcesJson as Record<string, RawSource[]>,
};
const reviewersBySlug = reviewersJson as Record<string, RawReviewer>;

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

function requireIsoDate(value: string | undefined, slug: string, field: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Blog post ${slug} is missing a real ${field} (YYYY-MM-DD)`);
  }
  const [y, mo, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    throw new Error(`Blog post ${slug} has an invalid ${field}: ${value}`);
  }
  return value;
}

function isCdcSource(entry: RawSource): boolean {
  const url = (entry.url ?? "").toLowerCase();
  if (url.includes("cdc.gov")) return true;
  const label = `${entry.title ?? ""} ${entry.publisher ?? ""}`;
  return /\bCDC\b/.test(label) || /centers for disease control/i.test(label);
}

function sourcesFor(slug: string, lang: Lang): Source[] {
  const raw = sourcesByLang[lang][slug];
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw new Error(`Sources for ${slug} must be an array`);
  const out: Source[] = [];
  raw.forEach((entry, i) => {
    if (isCdcSource(entry)) return;
    const title = entry?.title?.trim() ?? "";
    const url = entry?.url?.trim() ?? "";
    const publisher = entry?.publisher?.trim() ?? "";
    if (!title || !/^https?:\/\//i.test(url)) {
      throw new Error(`Source ${slug}[${i}] needs a title and an http(s) url`);
    }
    out.push(publisher ? { title, url, publisher } : { title, url });
  });
  return out;
}

function reviewerFor(slug: string, meta: Record<string, string>): Reviewer | null {
  const fmName = meta.reviewer_name?.trim() ?? "";
  const fmCredential = meta.reviewer_credential?.trim() ?? "";
  if ((fmName && !fmCredential) || (!fmName && fmCredential)) {
    throw new Error(`Blog post ${slug} reviewer needs both reviewer_name and reviewer_credential`);
  }
  if (fmName && fmCredential) return { name: fmName, credential: fmCredential };
  const fromConfig = reviewersBySlug[slug];
  if (!fromConfig) return null;
  const name = fromConfig.name?.trim() ?? "";
  const credential = fromConfig.credential?.trim() ?? "";
  if ((name && !credential) || (!name && credential)) {
    throw new Error(`Reviewer for ${slug} needs both name and credential`);
  }
  if (name && credential) return { name, credential };
  return null;
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

function loadFile(file: string, lang: Lang): Post {
  const raw = readFileSync(join(dirFor(lang), file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const path = meta.slug || `/${lang}/blog/${file.replace(/\.md$/, "")}`;
  const slug = path.replace(new RegExp(`^/${lang}/blog/`), "");
  const expanded = expandFaq(body);
  // Strip the leading H1 from HTML body (rendered separately as page title) but keep it in bodyMd for diff checks.
  // Frontmatter parsing can leave a blank line, so the heading is not always at column 0.
  const bodyWithoutH1 = expanded.body.replace(/^\s*#\s+.+(?:\n+|$)/, "");
  const html = withStoreUtms(marked.parse(bodyWithoutH1, { async: false }) as string, lang);
  const date = requireIsoDate(meta.date, slug, "date");
  const dateModified = meta.updated ? requireIsoDate(meta.updated, slug, "updated") : date;
  return {
    slug,
    path,
    titleTag: meta.title_tag || h1(expanded.body),
    title: h1(expanded.body),
    description: meta.meta_description || "",
    date,
    dateModified,
    bodyMd: expanded.body,
    html,
    faq: expanded.faq,
    reviewer: reviewerFor(slug, meta),
    sources: sourcesFor(slug, lang),
  };
}

export function listPosts(lang: Lang = "he"): PostMeta[] {
  return readdirSync(dirFor(lang))
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const p = loadFile(f, lang);
      return {
        slug: p.slug,
        path: p.path,
        titleTag: p.titleTag,
        title: p.title,
        description: p.description,
        date: p.date,
        dateModified: p.dateModified,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getPost(slug: string, lang: Lang = "he"): Post | null {
  const file = `${slug}.md`;
  try {
    return loadFile(file, lang);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export function allSlugs(lang: Lang = "he"): string[] {
  return listPosts(lang).map((p) => p.slug);
}
