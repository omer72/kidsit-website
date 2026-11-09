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
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
