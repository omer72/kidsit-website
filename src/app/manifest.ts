import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kidsit AI",
    short_name: "Kidsit AI",
    start_url: "/en",
    display: "browser",
    background_color: "#F3F6FF",
    theme_color: "#F3F6FF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
