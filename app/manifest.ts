import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "Aries",
    short_name:       "Aries",
    description:      "Family medical history tracker",
    start_url:        "/",
    display:          "standalone",
    background_color: "#0f172a",
    theme_color:      "#6366f1",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["health", "medical"],
  };
}
