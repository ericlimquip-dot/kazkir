import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kazkir",
    short_name: "Kazkir",
    description: "Plan trips abroad together: itinerary, tours, references, budget in Rupiah.",
    start_url: "/trips",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#bce7f8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
