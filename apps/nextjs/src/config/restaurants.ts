import type { Restaurant } from "@acme/shared-types";

export interface RestaurantConfig {
  /** Unique ID matching the Google Sheet tab / scraper ID (e.g. "iso-paja") */
  id: string;
  /** Custom display name override (optional) */
  name?: string;
  /** Official website URL */
  websiteUrl?: string;
}

/**
 * Ordered list of restaurant configurations and metadata.
 * Adjust the array order here to change how restaurants appear on the page.
 */
export const RESTAURANT_CONFIGS: RestaurantConfig[] = [
  {
    id: "huoltamo",
    name: "Huoltamo",
    websiteUrl:
      "https://script.google.com/macros/s/AKfycbwiEKW1OV5EPb6cI8mm0f07wByo9B9xqIPdEcjZ2zgKRifhoE7hrnnASo4WsEVk5bSm/exec?hl",
  },
  {
    id: "piccolo",
    name: "Piccolo",
    websiteUrl:
      "https://script.google.com/macros/s/AKfycbwiEKW1OV5EPb6cI8mm0f07wByo9B9xqIPdEcjZ2zgKRifhoE7hrnnASo4WsEVk5bSm/exec?hl",
  },
  {
    id: "iso-paja",
    name: "Iso Paja",
    websiteUrl: "https://www.hhravintolat.fi/iso-paja/",
  },
  {
    id: "studio-10",
    name: "Studio 10",
    websiteUrl: "https://nordrest.fi/restaurang/yle-studio10/#ruokalista",
  },
  {
    id: "pasilan-linkki",
    name: "Pasilan Linkki",
    websiteUrl:
      "https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/",
  },
  {
    id: "paattari",
    name: "Päättäri (xBåx)",
    websiteUrl: "https://nordrest.fi/restaurang/ravintola-paattari/#ruokalista",
  },
  {
    id: "akseli",
    name: "Akseli",
    websiteUrl:
      "https://www.ninankeittio.fi/helsinki-ilmala-akseli/#lounaslista",
  },
  {
    id: "dylan-luft",
    name: "Dylan Luft",
    websiteUrl: "https://www.dylan.fi/luft",
  },
  {
    id: "dylan-bole",
    name: "Dylan Böle",
    websiteUrl: "https://www.dylan.fi/bole",
  },
  {
    id: "dylan-la-ilma",
    name: "Dylan La Ilma",
    websiteUrl: "https://www.dylan.fi/lailma",
  },
];

/**
 * Merges static configuration metadata with dynamically fetched restaurant data
 * and sorts them according to RESTAURANT_CONFIGS order.
 */
export function getSortedRestaurantsWithMetadata(
  restaurants: Restaurant[],
): Restaurant[] {
  const configMap = new Map(
    RESTAURANT_CONFIGS.map((cfg, idx) => [cfg.id, { ...cfg, order: idx }]),
  );

  return [...restaurants]
    .map((restaurant) => {
      const config = configMap.get(restaurant.id);
      return {
        ...restaurant,
        name: config?.name ?? restaurant.name,
        websiteUrl: config?.websiteUrl ?? restaurant.websiteUrl,
      };
    })
    .sort((a, b) => {
      const orderA = configMap.get(a.id)?.order ?? 9999;
      const orderB = configMap.get(b.id)?.order ?? 9999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name, "fi");
    });
}
