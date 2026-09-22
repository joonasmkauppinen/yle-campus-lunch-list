import { describe, expect, it } from "vitest";

import type { Restaurant } from "@acme/shared-types";

import robots from "../app/robots";
import {
  generateHomeJsonLd,
  generateRestaurantJsonLd,
  getBaseUrl,
  mapDietaryFlagsToSchema,
} from "./seo";

describe("SEO utilities", () => {
  it("getBaseUrl returns valid URL string", () => {
    const url = getBaseUrl();
    expect(url.startsWith("http://") || url.startsWith("https://")).toBe(true);
  });

  it("mapDietaryFlagsToSchema maps gluten, vegan and lactose flags", () => {
    expect(mapDietaryFlagsToSchema(["G", "L", "VEG"])).toEqual([
      "https://schema.org/GlutenFreeDiet",
      "https://schema.org/VeganDiet",
      "https://schema.org/LactoseRestrictedDiet",
    ]);
    expect(mapDietaryFlagsToSchema([])).toEqual([]);
    expect(mapDietaryFlagsToSchema(undefined)).toEqual([]);
  });

  it("generateRestaurantJsonLd generates valid Schema.org Restaurant format", () => {
    const restaurant: Restaurant = {
      id: "iso-paja",
      name: "Iso Paja",
      websiteUrl: "https://www.hhravintolat.fi/iso-paja/",
      address: {
        street: "Radiokatu 3",
        postalCode: "00240",
        city: "Helsinki",
      },
      menus: [
        {
          date: "2026-08-31",
          items: [
            {
              name: "Lihapullat ja muusi",
              dietaryFlags: ["G", "L"],
            },
          ],
        },
      ],
      lastUpdated: "2026-08-31T10:00:00Z",
    };

    const schema = generateRestaurantJsonLd(
      restaurant,
      restaurant.menus[0],
      "https://yle-campus-lunch-list.vercel.app",
    );

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Restaurant");
    expect(schema.name).toBe("Iso Paja");
    expect(schema.url).toBe(
      "https://yle-campus-lunch-list.vercel.app/restaurant/iso-paja",
    );
    expect(schema.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Radiokatu 3",
      postalCode: "00240",
      addressLocality: "Helsinki",
      addressRegion: "Uusimaa",
      addressCountry: "FI",
    });
    expect(schema.hasMenu).toBeTruthy();
  });

  it("generateHomeJsonLd generates WebSite and ItemList schemas", () => {
    const restaurants: Restaurant[] = [
      {
        id: "iso-paja",
        name: "Iso Paja",
        menus: [],
        lastUpdated: "2026-08-31T10:00:00Z",
      },
    ];

    const schemas = generateHomeJsonLd(
      restaurants,
      "https://yle-campus-lunch-list.vercel.app",
    );
    expect(schemas.length).toBe(2);
    expect(schemas[0]?.["@type"]).toBe("WebSite");
    expect(schemas[1]?.["@type"]).toBe("ItemList");
  });

  it("robots disallows /radiator and /api/ paths", () => {
    const robotsResult = robots();
    expect(robotsResult.rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/radiator"],
    });
  });
});
