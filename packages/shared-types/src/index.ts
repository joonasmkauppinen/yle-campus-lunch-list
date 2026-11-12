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
 * The fixed Areas restaurants are grouped by on the page, in default order.
 * Like Dish Tags, the stable ids live here and the Finnish labels in the
 * frontend config. See CONTEXT.md.
 */
export const AREA_IDS = ["yle-campus", "ilmala", "pasila"] as const;

export type AreaId = (typeof AREA_IDS)[number];

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
  availability?: "published" | "closed" | "unpublished" | "failed";
  lastChecked?: string;
  lastSuccess?: string;
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
  /** The Area the restaurant belongs to. Absent for a sheet tab that has no
   * frontend config entry. */
  area?: AreaId;
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

/** Calendar dates use UTC only for arithmetic, never the host timezone. */
export function isIsoDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}

export function getWeekDates(date: string): string[] {
  if (!isIsoDate(date)) throw new Error(`Invalid calendar date: ${date}`);
  const anchor = new Date(`${date}T12:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(anchor);
    day.setUTCDate(day.getUTCDate() + offset);
    return day.toISOString().slice(0, 10);
  });
}
