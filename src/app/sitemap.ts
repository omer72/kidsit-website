import type { MetadataRoute } from "next";
import { LANGS } from "@/dictionaries";

const BASE = "https://kidsit.ai";

// Real content dates, so lastmod doesn't change on every build.
const PAGES = [
  { path: "", lastModified: "2026-10-14" },
  { path: "/privacy", lastModified: "2026-10-19" },
  { path: "/terms", lastModified: "2026-10-19" },
  { path: "/support", lastModified: "2026-10-19" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return LANGS.flatMap((lang) =>
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
}
