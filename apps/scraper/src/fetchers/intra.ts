import type { ParsedMenuItem } from "@acme/shared-types";

export const INTRA_DEFAULT_API_URL =
  "https://script.googleusercontent.com/a/macros/yle.fi/echo?user_content_key=AUkAhnT31DSF89GRyUPebcLX_oJz-Rkt0nXafVj3zNmfFHp8lvswkQTsNaHMrCG-lqxGmFaZIVDoRxEMxxamGgv-BmUXRUG-6Pd8NEdojaaKbu0Rj7vhaA698QYzWqv3O8pdDP06mxy_G235MxmF39xKmNWdzmgmOcZ0imeygA3tFSiXtstBnbwuoq8r9vZ4D8hAlz3EPBRtRAb323qQTqS2uphOR9KG5r63DY012Uq4p-9JQrGmOZ7O7PSZkGqdkXVzFp107HeJuz6jK11ikPvf8AppO0-Df8D_GAsh75a0NnMfXiVa8FV1-bf8YSN-Ww&lib=Mj9QMBIRZJsNk6tjp-CZc2vk6ee82Q7eC";

export type IntraRestaurantId = "huoltamo" | "studio-10" | "piccolo";

export interface IntraRestaurantConfig {
  id: IntraRestaurantId;
  name: string;
  apiRestaurantId: string;
  matcher: RegExp;
}

export const INTRA_RESTAURANTS: IntraRestaurantConfig[] = [
  {
    id: "huoltamo",
    name: "Huoltamo",
    apiRestaurantId: "id-c93fsacrg4",
    matcher: /huoltamo/i,
  },
  {
    id: "studio-10",
    name: "Studio 10",
    apiRestaurantId: "id-ly6fib1i5pj",
    matcher: /studio\s*10/i,
  },
  {
    id: "piccolo",
    name: "Piccolo",
    apiRestaurantId: "id-akwa139wa",
    matcher: /piccolo/i,
  },
];

export const HUOLTAMO_RESTAURANT_ID = "id-c93fsacrg4";
export const STUDIO_10_RESTAURANT_ID = "id-ly6fib1i5pj";
export const PICCOLO_RESTAURANT_ID = "id-akwa139wa";

export interface RawApiMenuItem {
  value?: string;
  diet?: string;
}

export interface RawApiItem {
  id?: string;
  date?: string;
  restaurant?: string;
  restaurantId?: string;
  menu?: string | RawApiMenuItem[];
}

export interface RawApiResponse {
  status?: number;
  items?: RawApiItem[];
}

/**
 * Converts a Date or ISO date string to a YYYY-MM-DD string in Europe/Helsinki timezone.
 */
export function getHelsinkiDateString(
  date: Date | string = new Date(),
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Parses dietary flags from the API diet string.
 * Handles comma separation, whitespace, and parentheses (e.g., "(L, G)").
 */
export function parseDietaryFlags(diet?: string): string[] {
  if (!diet) return [];
  const cleaned = diet.replace(/^\s*\((.*)\)\s*$/, "$1").trim();
  if (!cleaned) return [];
  return cleaned
    .split(",")
    .map((flag) => flag.trim())
    .filter((flag) => flag.length > 0);
}

/**
 * Parses the raw menu field which is typically a JSON-encoded string of array items.
 */
export function parseMenuField(
  menuField?: string | RawApiMenuItem[],
): RawApiMenuItem[] {
  if (!menuField) return [];
  if (Array.isArray(menuField)) return menuField;

  try {
    const parsed = JSON.parse(menuField) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as RawApiMenuItem[];
    }
  } catch (error) {
    console.error("[Intra] Failed to parse menu JSON string:", error);
  }
  return [];
}

/**
 * Finds the restaurant configuration for a given IntraRestaurantId.
 */
export function getIntraRestaurantConfig(
  restaurantId: IntraRestaurantId,
): IntraRestaurantConfig {
  const config = INTRA_RESTAURANTS.find((r) => r.id === restaurantId);
  if (!config) {
    throw new Error(`Unknown intra restaurant ID: ${restaurantId}`);
  }
  return config;
}

/**
 * Extracts lunch menu items for a specific intra restaurant and target date from the raw API response.
 */
export function parseIntraResponse(
  apiData: RawApiResponse,
  restaurantId: IntraRestaurantId,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  if (!apiData.items || !Array.isArray(apiData.items)) {
    return [];
  }

  const config = getIntraRestaurantConfig(restaurantId);

  // Match restaurant by restaurantId or restaurant name matcher
  const matchingEntries = apiData.items.filter((item) => {
    if (item.restaurantId === config.apiRestaurantId) return true;
    if (item.restaurant && config.matcher.test(item.restaurant)) return true;
    return false;
  });

  // Find the entry corresponding to the target date in Helsinki timezone
  const targetEntry = matchingEntries.find((item) => {
    if (!item.date) return false;
    const itemHelsinkiDate = getHelsinkiDateString(item.date);
    return itemHelsinkiDate === targetDate;
  });

  if (!targetEntry) {
    console.log(
      `[Intra] No menu entry found for ${config.name} (${restaurantId}) on date ${targetDate}`,
    );
    return [];
  }

  const rawMenuItems = parseMenuField(targetEntry.menu);
  const menus: ParsedMenuItem[] = [];

  for (const rawItem of rawMenuItems) {
    const itemName = rawItem.value?.trim();
    if (!itemName) continue;

    menus.push({
      date: targetDate,
      item: itemName,
      dietaryFlags: parseDietaryFlags(rawItem.diet),
    });
  }

  return menus;
}

/**
 * Extracts lunch menu items for all intra restaurants for the target date.
 */
export function parseIntraAllRestaurants(
  apiData: RawApiResponse,
  targetDate: string = getHelsinkiDateString(),
): Record<IntraRestaurantId, ParsedMenuItem[]> {
  const result: Record<IntraRestaurantId, ParsedMenuItem[]> = {
    huoltamo: [],
    "studio-10": [],
    piccolo: [],
  };

  for (const restaurant of INTRA_RESTAURANTS) {
    result[restaurant.id] = parseIntraResponse(
      apiData,
      restaurant.id,
      targetDate,
    );
  }

  return result;
}

/**
 * Backward compatibility alias for Huoltamo response parsing.
 */
export function parseHuoltamoResponse(
  apiData: RawApiResponse,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  return parseIntraResponse(apiData, "huoltamo", targetDate);
}

/**
 * Fetches and parses menu items for all intra restaurants (Huoltamo, Studio 10, Piccolo)
 * from the shared Google Apps Script JSON API.
 */
export async function fetchIntraMenus(
  targetDate: string = getHelsinkiDateString(),
  apiUrl: string = process.env.INTRA_API_URL ??
    process.env.HUOLTAMO_API_URL ??
    INTRA_DEFAULT_API_URL,
): Promise<Record<IntraRestaurantId, ParsedMenuItem[]>> {
  const targetUrl = apiUrl.replace(/^["']|["']$/g, "").trim();
  console.log(
    `[Intra] Fetching menus for date ${targetDate} from API (${targetUrl})...`,
  );

  const response = await fetch(targetUrl, {
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `[Intra] API request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const data = (await response.json()) as RawApiResponse;
  const menusByRestaurant = parseIntraAllRestaurants(data, targetDate);

  for (const restaurant of INTRA_RESTAURANTS) {
    const itemsCount = menusByRestaurant[restaurant.id].length;
    console.log(
      `[Intra] Successfully fetched ${itemsCount} menu items for ${restaurant.name} (${restaurant.id}) on ${targetDate}`,
    );
  }

  return menusByRestaurant;
}

/**
 * Helper to fetch Huoltamo menu items.
 */
export async function fetchHuoltamoMenu(
  targetDate: string = getHelsinkiDateString(),
  apiUrl?: string,
): Promise<ParsedMenuItem[]> {
  const allMenus = await fetchIntraMenus(targetDate, apiUrl);
  return allMenus.huoltamo;
}

/**
 * Helper to fetch Studio 10 menu items.
 */
export async function fetchStudio10Menu(
  targetDate: string = getHelsinkiDateString(),
  apiUrl?: string,
): Promise<ParsedMenuItem[]> {
  const allMenus = await fetchIntraMenus(targetDate, apiUrl);
  return allMenus["studio-10"];
}

/**
 * Helper to fetch Piccolo menu items.
 */
export async function fetchPiccoloMenu(
  targetDate: string = getHelsinkiDateString(),
  apiUrl?: string,
): Promise<ParsedMenuItem[]> {
  const allMenus = await fetchIntraMenus(targetDate, apiUrl);
  return allMenus.piccolo;
}
