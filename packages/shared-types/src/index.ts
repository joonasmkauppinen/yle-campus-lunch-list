/**
 * The fixed Dish Tag vocabulary. Stable English ids are stored in code and in
 * the sheet; the Finnish labels shown to the user live in the frontend config.
 *
 * Overlap is governed by "narrower wins" — the broader tag excludes the
 * narrower one — with `vegan` nesting inside `vegetarian` as the single
 * deliberate exception. See CONTEXT.md.
 */
export const DISH_TAG_IDS = [
  "meat",
  "chicken",
  "fish",
  "vegetarian",
  "vegan",
  "soup",
  "salad",
  "pizza",
  "burger",
  "dessert",
  "asian",
  "indian",
  "italian",
  "tex-mex",
] as const;

export type DishTagId = (typeof DISH_TAG_IDS)[number];

/**
 * Represents a single menu item parsed directly by a restaurant scraper/fetcher.
 */
export interface ParsedMenuItem {
  date: string; // ISO format YYYY-MM-DD
  item: string;
  dietaryFlags: string[];
  /** Dish Tags applied by the scraper. Absent or empty means untagged. */
  tags?: DishTagId[];
}

/**
 * Represents a flat canonical row written to and read from Google Sheets.
 */
export interface RestaurantMenu {
  restaurantId: string;
  restaurantName: string;
  date: string; // ISO format YYYY-MM-DD
  item: string;
  dietaryFlags: string[];
  lastUpdated: string; // ISO timestamp
  tags?: DishTagId[];
}

export interface MenuItem {
  name: string;
  price?: string;
  dietaryFlags?: string[]; // e.g., ["GF", "V"]
  tags?: DishTagId[];
}

export interface DailyMenu {
  date: string; // ISO format YYYY-MM-DD
  items: MenuItem[];
}

export interface RestaurantOpeningHours {
  restaurantId: string;
  restaurantName: string;
  openHours?: string;
  lunchHours?: string;
  rawText?: string;
  lastUpdated: string;
}

export interface RestaurantAddress {
  street: string;
  postalCode: string;
  city: string;
}

export interface Restaurant {
  id: string;
  name: string;
  websiteUrl?: string;
  address?: RestaurantAddress;
  openingHours?: RestaurantOpeningHours;
  menus: DailyMenu[];
  lastUpdated: string; // ISO format
}

/**
 * Legacy API compatibility types for GET /api/current-day-menus
 */
export interface LegacyMenuItem {
  text: string;
  markdown?: string;
}

export type LegacyRestaurantMenus = Record<string, LegacyMenuItem[]>;

export interface LegacyCurrentDayMenusResponse {
  restaurant: LegacyRestaurantMenus;
}
