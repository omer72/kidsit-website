import type { MetadataRoute } from "next";
import { LANGS } from "@/dictionaries";
import { listPosts } from "@/lib/blog";

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
  // Blog is Hebrew-only (no EN counterpart).
  const posts = listPosts();
  const blog: MetadataRoute.Sitemap = [
    { url: `${BASE}/he/blog`, lastModified: "2026-10-19" },
    ...posts.map((p) => ({ url: `${BASE}${p.path}`, lastModified: p.date })),
  ];
  return [...bilingual, ...blog];
}
