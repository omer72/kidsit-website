import type { MetadataRoute } from "next";
import { colors } from "@/colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kidsit AI",
    short_name: "Kidsit AI",
    start_url: "/en",
    display: "browser",
    background_color: colors.paper,
    theme_color: colors.paper,
    // Lets Chrome on Android know the Play app that belongs to this site. Not preferred (no PWA is offered), so nothing else changes.
    related_applications: [
      { platform: "play", id: "ai.kidsit.app", url: "https://play.google.com/store/apps/details?id=ai.kidsit.app" },
    ],
    prefer_related_applications: false,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
