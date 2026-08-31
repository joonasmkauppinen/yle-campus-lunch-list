import type { DailyMenu, Restaurant } from "@acme/shared-types";

import { env } from "~/env";

/**
 * Returns the fully-qualified base URL for metadata, canonical links, and sitemaps.
 */
export function getBaseUrl(): string {
  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  if (env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://yle-campus-lunch-list.vercel.app";
}

/**
 * Maps standard Finnish dietary flags to Schema.org RestrictedDiet enumeration.
 */
export function mapDietaryFlagsToSchema(flags?: string[]): string[] {
  if (!flags || flags.length === 0) return [];

  const schemaDiets: string[] = [];
  const upperFlags = flags.map((f) => f.toUpperCase().trim());

  if (upperFlags.includes("G") || upperFlags.includes("GL")) {
    schemaDiets.push("https://schema.org/GlutenFreeDiet");
  }
  if (upperFlags.includes("VEG") || upperFlags.includes("V")) {
    schemaDiets.push("https://schema.org/VeganDiet");
  }
  if (
    upperFlags.includes("L") ||
    upperFlags.includes("M") ||
    upperFlags.includes("VL")
  ) {
    schemaDiets.push("https://schema.org/LactoseRestrictedDiet");
  }

  return schemaDiets;
}

/**
 * Generates Schema.org JSON-LD for a single restaurant and its current menu.
 */
export function generateRestaurantJsonLd(
  restaurant: Restaurant,
  currentMenu?: DailyMenu,
  baseUrl = getBaseUrl(),
) {
  const pageUrl = `${baseUrl}/restaurant/${restaurant.id}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${pageUrl}#restaurant`,
    name: restaurant.name,
    url: pageUrl,
    servesCuisine: ["Lounas", "Suomalainen"],
    inLanguage: "fi",
  };

  if (restaurant.websiteUrl) {
    schema.sameAs = [restaurant.websiteUrl];
  }

  if (restaurant.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: restaurant.address.street,
      postalCode: restaurant.address.postalCode,
      addressLocality: restaurant.address.city,
      addressRegion: "Uusimaa",
      addressCountry: "FI",
    };
  }

  if (currentMenu && currentMenu.items.length > 0) {
    schema.hasMenu = {
      "@type": "Menu",
      name: `Päivän lounaslista (${currentMenu.date})`,
      inLanguage: "fi",
      hasMenuItem: currentMenu.items.map((item) => {
        const itemSchema: Record<string, unknown> = {
          "@type": "MenuItem",
          name: item.name,
        };

        if (item.price) {
          itemSchema.offers = {
            "@type": "Offer",
            price: item.price,
            priceCurrency: "EUR",
          };
        }

        const diets = mapDietaryFlagsToSchema(item.dietaryFlags);
        if (diets.length > 0) {
          itemSchema.suitableForDiet = diets.length === 1 ? diets[0] : diets;
        }

        return itemSchema;
      }),
    };
  }

  return schema;
}

/**
 * Generates Schema.org JSON-LD ItemList & WebSite for the root homepage.
 */
export function generateHomeJsonLd(
  restaurants: Restaurant[],
  baseUrl = getBaseUrl(),
) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${baseUrl}#website`,
      url: baseUrl,
      name: "Lounaslistat – Ylen kampus & Pasila",
      description:
        "Päivittäiset lounaslistat ja aukioloajat Ylen kampusalueen ja Pasilan ravintoloista Helsingissä.",
      inLanguage: "fi",
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${baseUrl}#restaurants`,
      name: "Ylen kampuksen ja Pasilan lounasravintolat",
      itemListElement: restaurants.map((restaurant, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Restaurant",
          "@id": `${baseUrl}/restaurant/${restaurant.id}#restaurant`,
          name: restaurant.name,
          url: `${baseUrl}/restaurant/${restaurant.id}`,
          ...(restaurant.address
            ? {
                address: {
                  "@type": "PostalAddress",
                  streetAddress: restaurant.address.street,
                  postalCode: restaurant.address.postalCode,
                  addressLocality: restaurant.address.city,
                  addressCountry: "FI",
                },
              }
            : {}),
        },
      })),
    },
  ];
}
