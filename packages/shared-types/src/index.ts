/**
 * Represents a single menu item parsed directly by a restaurant scraper/fetcher.
 */
export interface ParsedMenuItem {
  date: string; // ISO format YYYY-MM-DD
  item: string;
  dietaryFlags: string[];
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
}

export interface MenuItem {
  name: string;
  price?: string;
  dietaryFlags?: string[]; // e.g., ["GF", "V"]
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
