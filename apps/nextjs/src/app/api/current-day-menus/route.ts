import type {
  LegacyCurrentDayMenusResponse,
  LegacyMenuItem,
  LegacyRestaurantMenus,
  MenuItem,
  Restaurant,
} from "@acme/shared-types";

import { RESTAURANT_CONFIGS } from "~/config/restaurants";
import { isCurrentDate } from "~/lib/dates";
import { fetchRestaurantsFromGoogleSheets } from "~/lib/sheets";

// Revalidation interval (1 hour)
export const revalidate = 3600;

/**
 * Converts a kebab-case restaurant ID to camelCase (e.g. "iso-paja" -> "isoPaja", "studio-10" -> "studio10").
 */
export function toCamelCase(id: string): string {
  return id.replace(/-([a-z0-9])/gi, (_, char: string) => char.toUpperCase());
}

/**
 * Formats a canonical MenuItem into the legacy API MenuItem format ({ text: string }).
 */
export function formatMenuItemToLegacy(item: MenuItem): LegacyMenuItem {
  let text = item.name.trim();
  if (item.dietaryFlags && item.dietaryFlags.length > 0) {
    text = `${text} (${item.dietaryFlags.join(", ")})`;
  }
  return { text };
}

/**
 * Transforms restaurant list from Google Sheets into the legacy RestaurantMenus shape.
 */
export function transformToLegacyRestaurantMenus(
  restaurants: Restaurant[],
): LegacyRestaurantMenus {
  const result: LegacyRestaurantMenus = {};

  const restaurantMap = new Map(
    restaurants.map((r) => [r.id.toLowerCase(), r]),
  );

  // 1. Process all configured restaurants in standard order
  for (const config of RESTAURANT_CONFIGS) {
    const key = toCamelCase(config.id);

    const restaurant =
      restaurantMap.get(config.id.toLowerCase()) ??
      restaurantMap.get(key.toLowerCase());

    const currentMenu = restaurant?.menus.find((m) => isCurrentDate(m.date));

    if (currentMenu && currentMenu.items.length > 0) {
      result[key] = currentMenu.items.map(formatMenuItemToLegacy);
    } else {
      result[key] = [];
    }
  }

  // 2. Include any additional restaurants found in sheets that weren't in RESTAURANT_CONFIGS
  for (const restaurant of restaurants) {
    const key = toCamelCase(restaurant.id);
    if (!(key in result)) {
      const currentMenu = restaurant.menus.find((m) => isCurrentDate(m.date));
      if (currentMenu && currentMenu.items.length > 0) {
        result[key] = currentMenu.items.map(formatMenuItemToLegacy);
      } else {
        result[key] = [];
      }
    }
  }

  return result;
}

export async function GET() {
  try {
    const { restaurants, error } = await fetchRestaurantsFromGoogleSheets();

    if (error && restaurants.length === 0) {
      return Response.json(
        { error },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const restaurantMenus = transformToLegacyRestaurantMenus(restaurants);
    const responseBody: LegacyCurrentDayMenusResponse = {
      restaurant: restaurantMenus,
    };

    return Response.json(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    return Response.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
