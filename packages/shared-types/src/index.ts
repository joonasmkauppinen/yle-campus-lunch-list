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

export interface Restaurant {
  id: string;
  name: string;
  websiteUrl?: string;
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

/**
 * Category suggestions types for Issue #49
 */
export interface CategoryMatchItem {
  restaurantId: string;
  restaurantName: string;
  item: string;
  dietaryFlags?: string[];
}

export interface LunchCategory {
  id: string; // e.g., "liha", "kala", "kana", "vege", "kasvis", "burgeri", "pizza", "aasialainen", "tex-mex"
  label: string; // e.g., "Liha", "Kala", "Kana", "Vege", "Kasvis", "Burgeri", "Pizza", "Aasialainen", "Tex Mex"
  icon: string; // e.g., "meat", "fish", "chicken", "vegan", "vege", "burger", "pizza", "asian", "texmex"
  items: CategoryMatchItem[];
}

export interface DailyCategories {
  date: string; // ISO format YYYY-MM-DD
  lastUpdated: string; // ISO timestamp
  categories: LunchCategory[];
}

export interface CategorySheetRow {
  categoryId: string;
  categoryLabel: string;
  date: string;
  restaurantId: string;
  restaurantName: string;
  item: string;
  dietaryFlags: string;
  lastUpdated: string;
}
