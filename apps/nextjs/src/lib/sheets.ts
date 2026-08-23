import { google } from "googleapis";

import type {
  DailyCategories,
  LunchCategory,
  MenuItem,
  Restaurant,
  RestaurantOpeningHours,
} from "@acme/shared-types";

import { env } from "~/env";
import { isCurrentDate } from "~/lib/dates";

/**
 * Safely extracts a string from unknown cell data and trims whitespace.
 */
function safeString(val: unknown): string {
  if (typeof val === "string") {
    return val.trim();
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val).trim();
  }
  return "";
}

/**
 * Extracts a Google Spreadsheet ID from either a full Google Sheets URL
 * or a raw ID string.
 */
export function extractSpreadsheetId(input?: string): string | undefined {
  if (!input) return undefined;
  let trimmed = input.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  if (!trimmed) return undefined;

  const match = /\/d\/([a-zA-Z0-9-_]+)/.exec(trimmed);
  if (match?.[1]) {
    return match[1];
  }

  return trimmed;
}

export interface SpreadsheetResolution {
  spreadsheetId?: string;
  source?: string;
  isDev: boolean;
}

export function getSpreadsheetResolution(): SpreadsheetResolution {
  const isDev = env.NODE_ENV !== "production";

  if (isDev) {
    const devUrlOrId =
      env.DEV_GOOGLE_SHEETS_URL ??
      env.GOOGLE_SHEETS_DEV_URL ??
      env.DEV_GOOGLE_SHEETS_ID ??
      env.GOOGLE_SHEETS_DEV_ID;

    if (devUrlOrId) {
      const parsedId = extractSpreadsheetId(devUrlOrId);
      if (parsedId) {
        const sourceName = env.DEV_GOOGLE_SHEETS_URL
          ? "DEV_GOOGLE_SHEETS_URL"
          : env.GOOGLE_SHEETS_DEV_URL
            ? "GOOGLE_SHEETS_DEV_URL"
            : env.DEV_GOOGLE_SHEETS_ID
              ? "DEV_GOOGLE_SHEETS_ID"
              : "GOOGLE_SHEETS_DEV_ID";
        return {
          spreadsheetId: parsedId,
          source: sourceName,
          isDev: true,
        };
      }
    }
  }

  const defaultUrlOrId = env.GOOGLE_SHEETS_ID ?? env.GOOGLE_SHEETS_URL;

  if (defaultUrlOrId) {
    const parsedId = extractSpreadsheetId(defaultUrlOrId);
    if (parsedId) {
      const sourceName = env.GOOGLE_SHEETS_ID
        ? "GOOGLE_SHEETS_ID"
        : "GOOGLE_SHEETS_URL";
      return {
        spreadsheetId: parsedId,
        source: sourceName,
        isDev,
      };
    }
  }

  return { isDev };
}

export interface OpeningHoursSpreadsheetResolution {
  spreadsheetId?: string;
  source?: string;
}

export function getOpeningHoursSpreadsheetResolution(): OpeningHoursSpreadsheetResolution {
  const urlOrId =
    env.GOOGLE_SHEETS_OPENING_HOURS_ID ?? env.GOOGLE_SHEETS_OPENING_HOURS_URL;

  if (urlOrId) {
    const parsedId = extractSpreadsheetId(urlOrId);
    if (parsedId) {
      const sourceName = env.GOOGLE_SHEETS_OPENING_HOURS_ID
        ? "GOOGLE_SHEETS_OPENING_HOURS_ID"
        : "GOOGLE_SHEETS_OPENING_HOURS_URL";
      return {
        spreadsheetId: parsedId,
        source: sourceName,
      };
    }
  }

  return {};
}

export function getCategorySpreadsheetResolution(): SpreadsheetResolution {
  const isDev = env.NODE_ENV !== "production";

  if (isDev) {
    const devUrlOrId =
      env.DEV_GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_URL ??
      env.GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_DEV_URL ??
      env.DEV_GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_ID ??
      env.GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_DEV_ID;

    if (devUrlOrId) {
      const parsedId = extractSpreadsheetId(devUrlOrId);
      if (parsedId) {
        const sourceName = env.DEV_GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_URL
          ? "DEV_GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_URL"
          : env.GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_DEV_URL
            ? "GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_DEV_URL"
            : env.DEV_GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_ID
              ? "DEV_GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_ID"
              : "GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_DEV_ID";
        return {
          spreadsheetId: parsedId,
          source: sourceName,
          isDev: true,
        };
      }
    }
  }

  const defaultUrlOrId =
    env.GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_ID ??
    env.GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_URL;

  if (defaultUrlOrId) {
    const parsedId = extractSpreadsheetId(defaultUrlOrId);
    if (parsedId) {
      const sourceName = env.GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_ID
        ? "GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_ID"
        : "GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_URL";
      return {
        spreadsheetId: parsedId,
        source: sourceName,
        isDev,
      };
    }
  }

  return { isDev };
}

function formatRestaurantTitle(id: string): string {
  return id
    .split(/[-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function fetchOpeningHoursFromGoogleSheets(): Promise<
  Record<string, RestaurantOpeningHours>
> {
  const { spreadsheetId } = getOpeningHoursSpreadsheetResolution();
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let privateKey = env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.trim();
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (!spreadsheetId || !clientEmail || !privateKey) {
    return {};
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitles = (spreadsheet.data.sheets ?? [])
      .map((s) => s.properties?.title)
      .filter((t): t is string => typeof t === "string" && t.length > 0);

    const targetTab = sheetTitles.includes("opening-hours")
      ? "opening-hours"
      : sheetTitles[0];

    if (!targetTab) {
      return {};
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${targetTab}'!A2:F`,
    });

    const rows = response.data.values ?? [];
    const mapping: Record<string, RestaurantOpeningHours> = {};

    for (const row of rows) {
      const restaurantId = safeString(row[0]);
      if (!restaurantId) continue;

      const restaurantName = safeString(row[1]);
      const openHours = safeString(row[2]);
      const lunchHours = safeString(row[3]);
      const rawText = safeString(row[4]);
      const lastUpdated = safeString(row[5]) || new Date().toISOString();

      mapping[restaurantId] = {
        restaurantId,
        restaurantName,
        openHours: openHours || undefined,
        lunchHours: lunchHours || undefined,
        rawText: rawText || undefined,
        lastUpdated,
      };
    }

    return mapping;
  } catch (error) {
    console.error("[Google Sheets] Error fetching opening hours data:", error);
    return {};
  }
}

export interface FetchResult {
  restaurants: Restaurant[];
  error?: string;
  resolvedSpreadsheetId?: string;
  source?: string;
  isDev: boolean;
}

export async function fetchRestaurantsFromGoogleSheets(): Promise<FetchResult> {
  const { spreadsheetId, source, isDev } = getSpreadsheetResolution();
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let privateKey = env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.trim();
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (!spreadsheetId) {
    return {
      restaurants: [],
      error:
        "Google Sheets ID is not configured. Please set GOOGLE_SHEETS_ID or DEV_GOOGLE_SHEETS_URL.",
      isDev,
    };
  }

  if (!clientEmail || !privateKey) {
    return {
      restaurants: [],
      error:
        "Google Service Account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY) are missing.",
      resolvedSpreadsheetId: spreadsheetId,
      source,
      isDev,
    };
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Concurrently fetch menu metadata and opening hours
    const [spreadsheet, openingHoursMap] = await Promise.all([
      sheets.spreadsheets.get({ spreadsheetId }),
      fetchOpeningHoursFromGoogleSheets(),
    ]);

    const sheetTitles = (spreadsheet.data.sheets ?? [])
      .map((s) => s.properties?.title)
      .filter(
        (t): t is string =>
          typeof t === "string" &&
          t.length > 0 &&
          t.toLowerCase() !== "categories",
      );

    if (sheetTitles.length === 0) {
      return {
        restaurants: [],
        error: "Spreadsheet contains no sheet tabs.",
        resolvedSpreadsheetId: spreadsheetId,
        source,
        isDev,
      };
    }

    const ranges = sheetTitles.map((title) => `'${title}'!A2:F`);
    const batchResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const todayIsoDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Helsinki",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const restaurants: Restaurant[] = [];
    const valueRanges = batchResponse.data.valueRanges ?? [];

    for (let i = 0; i < sheetTitles.length; i++) {
      const tabTitle = sheetTitles[i];
      if (!tabTitle) continue;

      const valRange = valueRanges[i];
      const rawRows = valRange?.values ?? [];

      if (rawRows.length === 0) {
        // Tab exists but has no rows currently published
        restaurants.push({
          id: tabTitle,
          name: formatRestaurantTitle(tabTitle),
          openingHours: openingHoursMap[tabTitle],
          lastUpdated: new Date().toISOString(),
          menus: [
            {
              date: todayIsoDate,
              items: [],
            },
          ],
        });
        continue;
      }

      // First valid row gives restaurant metadata
      const firstRow = rawRows[0];
      const rowRestaurantId = safeString(firstRow?.[0]);
      const rowRestaurantName = safeString(firstRow?.[1]);
      const rowMenuDate = safeString(firstRow?.[2]);
      const rowLastUpdated = safeString(firstRow?.[5]);

      const restaurantId =
        rowRestaurantId.length > 0 ? rowRestaurantId : tabTitle;
      const restaurantName =
        rowRestaurantName.length > 0
          ? rowRestaurantName
          : formatRestaurantTitle(tabTitle);
      const menuDate = rowMenuDate.length > 0 ? rowMenuDate : todayIsoDate;
      const lastUpdated =
        rowLastUpdated.length > 0 ? rowLastUpdated : new Date().toISOString();

      const items: MenuItem[] = [];
      for (const row of rawRows) {
        const itemText = safeString(row[3]);
        if (!itemText) continue;

        const dietaryRaw = safeString(row[4]);
        const dietaryFlags =
          dietaryRaw.length > 0
            ? dietaryRaw
                .split(",")
                .map((f) => f.trim())
                .filter((f) => f.length > 0)
            : [];

        items.push({
          name: itemText,
          dietaryFlags,
        });
      }

      restaurants.push({
        id: restaurantId,
        name: restaurantName,
        openingHours:
          openingHoursMap[restaurantId] ?? openingHoursMap[tabTitle],
        lastUpdated,
        menus: [
          {
            date: menuDate,
            items,
          },
        ],
      });
    }

    return {
      restaurants,
      resolvedSpreadsheetId: spreadsheetId,
      source,
      isDev,
    };
  } catch (error) {
    console.error("[Google Sheets] Error fetching sheet data:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch menu data from Google Sheets.";
    return {
      restaurants: [],
      error: errorMessage,
      resolvedSpreadsheetId: spreadsheetId,
      source,
      isDev,
    };
  }
}

export interface FetchCategoriesResult {
  dailyCategories: DailyCategories | null;
  error?: string;
  resolvedSpreadsheetId?: string;
  source?: string;
  isDev: boolean;
}

const CATEGORY_ICON_MAP: Record<string, string> = {
  liha: "meat",
  kala: "fish",
  kana: "chicken",
  vege: "vegan",
  kasvis: "vege",
  burgeri: "burger",
  pizza: "pizza",
  aasialainen: "asian",
  "tex-mex": "texmex",
};

export async function fetchCategorySuggestionsFromGoogleSheets(): Promise<FetchCategoriesResult> {
  const { spreadsheetId, source, isDev } = getCategorySpreadsheetResolution();
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let privateKey = env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.trim();
    if (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (!spreadsheetId) {
    return {
      dailyCategories: null,
      isDev,
    };
  }

  if (!clientEmail || !privateKey) {
    return {
      dailyCategories: null,
      error: "Google Service Account credentials missing.",
      resolvedSpreadsheetId: spreadsheetId,
      source,
      isDev,
    };
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const firstSheetTitle =
      spreadsheet.data.sheets?.[0]?.properties?.title ?? "Sheet1";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${firstSheetTitle}'!A2:H`,
    });

    const rows = response.data.values ?? [];
    if (rows.length === 0) {
      return {
        dailyCategories: null,
        resolvedSpreadsheetId: spreadsheetId,
        source,
        isDev,
      };
    }

    const firstRowDate = safeString(rows[0]?.[2]);
    const firstRowLastUpdated =
      safeString(rows[0]?.[7]) || new Date().toISOString();

    // Check date staleness
    if (!firstRowDate || !isCurrentDate(firstRowDate)) {
      console.log(
        `[Category Suggestions] Categories data date '${firstRowDate}' is stale. Omitting suggestions.`,
      );
      return {
        dailyCategories: null,
        resolvedSpreadsheetId: spreadsheetId,
        source,
        isDev,
      };
    }

    const categoriesMap = new Map<string, LunchCategory>();

    for (const row of rows) {
      const categoryId = safeString(row[0]);
      const categoryLabel = safeString(row[1]) || categoryId;
      const rowDate = safeString(row[2]);
      const restaurantId = safeString(row[3]);
      const restaurantName = safeString(row[4]);
      const item = safeString(row[5]);
      const dietaryRaw = safeString(row[6]);

      if (!categoryId || !item || rowDate !== firstRowDate) continue;

      const dietaryFlags =
        dietaryRaw.length > 0
          ? dietaryRaw
              .split(",")
              .map((f) => f.trim())
              .filter((f) => f.length > 0)
          : [];

      let category = categoriesMap.get(categoryId);
      if (!category) {
        category = {
          id: categoryId,
          label: categoryLabel,
          icon: CATEGORY_ICON_MAP[categoryId] ?? categoryId,
          items: [],
        };
        categoriesMap.set(categoryId, category);
      }

      category.items.push({
        restaurantId,
        restaurantName,
        item,
        dietaryFlags,
      });
    }

    const categories = Array.from(categoriesMap.values()).filter(
      (c) => c.items.length > 0,
    );

    if (categories.length === 0) {
      return {
        dailyCategories: null,
        resolvedSpreadsheetId: spreadsheetId,
        source,
        isDev,
      };
    }

    return {
      dailyCategories: {
        date: firstRowDate,
        lastUpdated: firstRowLastUpdated,
        categories,
      },
      resolvedSpreadsheetId: spreadsheetId,
      source,
      isDev,
    };
  } catch (error) {
    console.error(
      "[Google Sheets Categories] Error fetching category suggestions:",
      error,
    );
    return {
      dailyCategories: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch category suggestions.",
      resolvedSpreadsheetId: spreadsheetId,
      source,
      isDev,
    };
  }
}
