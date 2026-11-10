import type { AreaId, Restaurant, RestaurantAddress } from "@acme/shared-types";

export interface RestaurantConfig {
  /** Unique ID matching the Google Sheet tab / scraper ID (e.g. "iso-paja") */
  id: string;
  /** The Area the restaurant is grouped under on the page */
  area: AreaId;
  /** Custom display name override (optional) */
  name?: string;
  /** Official website URL */
  websiteUrl?: string;
  /** Physical street address */
  address?: RestaurantAddress;
}

export interface RestaurantArea {
  id: AreaId;
  /** Finnish heading shown to the user */
  label: string;
}

/**
 * The Areas in their default order on the page. Users can reorder and hide
 * them in the settings.
 */
export const RESTAURANT_AREAS: RestaurantArea[] = [
  { id: "yle-campus", label: "Ylen kampusalue" },
  { id: "ilmala", label: "Ilmala" },
  { id: "pasila", label: "Pasila" },
];

/**
 * Ordered list of restaurant configurations and metadata.
 * The array order sets the default order of restaurants within their Area.
 */
export const RESTAURANT_CONFIGS: RestaurantConfig[] = [
  {
    id: "huoltamo",
    area: "yle-campus",
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
    area: "yle-campus",
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
    area: "yle-campus",
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
    area: "yle-campus",
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
    area: "yle-campus",
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
    area: "ilmala",
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
    area: "ilmala",
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
    area: "ilmala",
    name: "Dylan Luft",
    websiteUrl: "https://www.dylan.fi/luft",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Ilmalantori 4",
    },
  },
  {
    id: "dylan-la-ilma",
    area: "ilmala",
    name: "Dylan La Ilma",
    websiteUrl: "https://www.dylan.fi/lailma",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Ilmalanrinne 1 A",
    },
  },
  {
    id: "dylan-bole",
    area: "pasila",
    name: "Dylan Böle",
    websiteUrl: "https://www.dylan.fi/bole",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Pasilankatu 10",
    },
  },
  {
    id: "piano",
    area: "pasila",
    name: "Ravintola Piano",
    websiteUrl: "https://www.ravintolapiano.fi/",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Pasilankatu 8",
    },
  },
  {
    id: "fennia",
    area: "pasila",
    name: "Ninan Keittiö Fennia",
    websiteUrl:
      "https://www.ninankeittio.fi/helsinki-pasila-fennia/#lounaslista",
    address: {
      city: "Helsinki",
      postalCode: "00240",
      street: "Kyllikinportti 2",
    },
  },
];

/**
 * Merges static configuration metadata with dynamically fetched restaurant data
 * and sorts them by Area, then by RESTAURANT_CONFIGS order.
 */
export function getSortedRestaurantsWithMetadata(
  restaurants: Restaurant[],
): Restaurant[] {
  const configMap = new Map(
    RESTAURANT_CONFIGS.map((cfg, idx) => [
      cfg.id,
      {
        ...cfg,
        areaOrder: RESTAURANT_AREAS.findIndex((area) => area.id === cfg.area),
        order: idx,
      },
    ]),
  );

  return [...restaurants]
    .map((restaurant) => {
      const config = configMap.get(restaurant.id);
      return {
        ...restaurant,
        name: config?.name ?? restaurant.name,
        area: config?.area ?? restaurant.area,
        websiteUrl: config?.websiteUrl ?? restaurant.websiteUrl,
        address: config?.address ?? restaurant.address,
      };
    })
    .sort((a, b) => {
      // Area first, then position in the config array. Restaurants without a
      // config entry go last, alphabetically.
      const configA = configMap.get(a.id);
      const configB = configMap.get(b.id);
      const areaOrderA = configA?.areaOrder ?? 9999;
      const areaOrderB = configB?.areaOrder ?? 9999;
      if (areaOrderA !== areaOrderB) {
        return areaOrderA - areaOrderB;
      }
      const orderA = configA?.order ?? 9999;
      const orderB = configB?.order ?? 9999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name, "fi");
    });
}
