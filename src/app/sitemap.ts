import type { MetadataRoute } from "next";
import { LANGS } from "@/dictionaries";

const BASE = "https://kidsit.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  return LANGS.flatMap((lang) =>
    ["", "/privacy", "/terms"].map((path) => ({
      url: `${BASE}/${lang}${path}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          LANGS.map((l) => [l, `${BASE}/${l}${path}`]),
        ),
      },
    })),
  );
}
