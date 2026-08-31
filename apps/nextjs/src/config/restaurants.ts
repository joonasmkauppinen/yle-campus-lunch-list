import type { Restaurant, RestaurantAddress } from "@acme/shared-types";

export interface RestaurantConfig {
  /** Unique ID matching the Google Sheet tab / scraper ID (e.g. "iso-paja") */
  id: string;
  /** Custom display name override (optional) */
  name?: string;
  /** Official website URL */
  websiteUrl?: string;
  /** Physical street address */
  address?: RestaurantAddress;
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
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Radiokatu 5",
    },
  },
  {
    id: "piccolo",
    name: "Piccolo",
    websiteUrl:
      "https://script.google.com/macros/s/AKfycbwiEKW1OV5EPb6cI8mm0f07wByo9B9xqIPdEcjZ2zgKRifhoE7hrnnASo4WsEVk5bSm/exec?hl",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Radiokatu 5",
    },
  },
  {
    id: "iso-paja",
    name: "Iso Paja",
    websiteUrl: "https://www.hhravintolat.fi/iso-paja/",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Radiokatu 3",
    },
  },
  {
    id: "studio-10",
    name: "Studio 10",
    websiteUrl: "https://nordrest.fi/restaurang/yle-studio10/#ruokalista",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Uutiskatu 8 A",
    },
  },
  {
    id: "pasilan-linkki",
    name: "Pasilan Linkki",
    websiteUrl:
      "https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Televisiokatu 4",
    },
  },
  {
    id: "paattari",
    name: "Päättäri (xBåx)",
    websiteUrl: "https://nordrest.fi/restaurang/ravintola-paattari/#ruokalista",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Televisiokatu 11",
    },
  },
  {
    id: "akseli",
    name: "Akseli",
    websiteUrl:
      "https://www.ninankeittio.fi/helsinki-ilmala-akseli/#lounaslista",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Ilmalankuja 3",
    },
  },
  {
    id: "dylan-luft",
    name: "Dylan Luft",
    websiteUrl: "https://www.dylan.fi/luft",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Ilmalantori 4",
    },
  },
  {
    id: "dylan-bole",
    name: "Dylan Böle",
    websiteUrl: "https://www.dylan.fi/bole",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Pasilankatu 10",
    },
  },
  {
    id: "dylan-la-ilma",
    name: "Dylan La Ilma",
    websiteUrl: "https://www.dylan.fi/lailma",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Ilmalanrinne 1 A",
    },
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
        address: config?.address ?? restaurant.address,
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
