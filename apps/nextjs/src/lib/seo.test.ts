import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Restaurant } from "@acme/shared-types";

import robots from "../app/robots";
import {
  generateHomeJsonLd,
  generateRestaurantJsonLd,
  getBaseUrl,
  mapDietaryFlagsToSchema,
} from "./seo";

void describe("SEO utilities", () => {
  void it("getBaseUrl returns valid URL string", () => {
    const url = getBaseUrl();
    assert.ok(url.startsWith("http://") || url.startsWith("https://"));
  });

  void it("mapDietaryFlagsToSchema maps gluten, vegan and lactose flags", () => {
    assert.deepEqual(mapDietaryFlagsToSchema(["G", "L", "VEG"]), [
      "https://schema.org/GlutenFreeDiet",
      "https://schema.org/VeganDiet",
      "https://schema.org/LactoseRestrictedDiet",
    ]);
    assert.deepEqual(mapDietaryFlagsToSchema([]), []);
    assert.deepEqual(mapDietaryFlagsToSchema(undefined), []);
  });

  void it("generateRestaurantJsonLd generates valid Schema.org Restaurant format", () => {
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

    assert.equal(schema["@context"], "https://schema.org");
    assert.equal(schema["@type"], "Restaurant");
    assert.equal(schema.name, "Iso Paja");
    assert.equal(
      schema.url,
      "https://yle-campus-lunch-list.vercel.app/restaurant/iso-paja",
    );
    assert.deepEqual(schema.address, {
      "@type": "PostalAddress",
      streetAddress: "Radiokatu 3",
      postalCode: "00240",
      addressLocality: "Helsinki",
      addressRegion: "Uusimaa",
      addressCountry: "FI",
    });
    assert.ok(schema.hasMenu);
  });

  void it("generateHomeJsonLd generates WebSite and ItemList schemas", () => {
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
    assert.equal(schemas.length, 2);
    assert.equal(schemas[0]?.["@type"], "WebSite");
    assert.equal(schemas[1]?.["@type"], "ItemList");
  });

  void it("robots disallows /radiator and /api/ paths", () => {
    const robotsResult = robots();
    assert.deepEqual(robotsResult.rules, {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/radiator"],
    });
  });
});
