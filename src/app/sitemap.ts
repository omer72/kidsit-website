import type { MetadataRoute } from "next";
import { LANGS } from "@/dictionaries";
import { blogIndexAlternates, listPosts, postLanguageAlternates, type PostMeta } from "@/lib/blog";

const BASE = "https://kidsit.ai";

// Real content dates, so lastmod doesn't change on every build.
const PAGES = [
  { path: "", lastModified: "2026-10-14" },
  { path: "/privacy", lastModified: "2026-10-19" },
  { path: "/terms", lastModified: "2026-10-19" },
  { path: "/support", lastModified: "2026-10-19" },
  { path: "/accessibility", lastModified: "2026-10-19" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const bilingual = LANGS.flatMap((lang) =>
    PAGES.map(({ path, lastModified }) => ({
      url: `${BASE}/${lang}${path}`,
      lastModified,
      alternates: {
        languages: {
          ...Object.fromEntries(LANGS.map((l) => [l, `${BASE}/${l}${path}`])),
          "x-default": `${BASE}/en${path}`,
        },
      },
    })),
  );
  const hePosts = listPosts("he");
  const enPosts = listPosts("en");
  const newest = (posts: PostMeta[], fallback: string) =>
    posts.reduce((max, p) => (p.dateModified > max ? p.dateModified : max), posts[0]?.dateModified ?? fallback);
  const absolute = (languages: Record<string, string>) =>
    Object.fromEntries(Object.entries(languages).map(([code, path]) => [code, `${BASE}${path}`]));
  const blog: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/he/blog`,
      lastModified: newest(hePosts, "2026-10-19"),
      alternates: { languages: absolute(blogIndexAlternates("he").languages) },
    },
    {
      url: `${BASE}/en/blog`,
      lastModified: newest(enPosts, "2026-11-02"),
      alternates: { languages: absolute(blogIndexAlternates("en").languages) },
    },
    ...hePosts.map((p) => {
      const alt = postLanguageAlternates("he", p.slug, p.path);
      return {
        url: `${BASE}${p.path}`,
        lastModified: p.dateModified,
        ...(alt.languages ? { alternates: { languages: absolute(alt.languages) } } : {}),
      };
    }),
    ...enPosts.map((p) => {
      const alt = postLanguageAlternates("en", p.slug, p.path);
      return {
        url: `${BASE}${p.path}`,
        lastModified: p.dateModified,
        ...(alt.languages ? { alternates: { languages: absolute(alt.languages) } } : {}),
      };
    }),
  ];
  return [...bilingual, ...blog];
}
