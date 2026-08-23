import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lounaslistat",
    short_name: "Lounaslistat",
    description: "Päivittäiset lounaslistat Ylen kampusalueen ravintoloista.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon_192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon_512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/touch-icon-iphone-retina_180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
