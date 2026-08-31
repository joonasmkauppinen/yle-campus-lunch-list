import type { MetadataRoute } from "next";

import { RESTAURANT_CONFIGS } from "~/config/restaurants";
import { getBaseUrl } from "~/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const restaurantRoutes: MetadataRoute.Sitemap = RESTAURANT_CONFIGS.map(
    (config) => ({
      url: `${baseUrl}/restaurant/${config.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }),
  );

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...restaurantRoutes,
  ];
}
