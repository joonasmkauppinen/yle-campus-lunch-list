import { google } from "googleapis";

import type {
  ParsedMenuItem,
  RestaurantOpeningHours,
} from "@acme/shared-types";

import {
  getOpeningHoursSpreadsheetResolution,
  getSpreadsheetResolution,
} from "./env.js";

/**
 * Formats parsed menu items into 2D table row arrays for Google Sheets.
 * Returns an empty array if there are no menu items.
 */
export function formatMenuRows(
  restaurantId: string,
  restaurantName: string,
  menus: ParsedMenuItem[],
  lastUpdated: string = new Date().toISOString(),
): string[][] {
  if (menus.length === 0) {
    return [];
  }

  return menus.map((menu) => [
    restaurantId,
    restaurantName,
    menu.date,
    menu.item,
    menu.dietaryFlags.join(", "),
    lastUpdated,
  ]);
}

export async function updateGoogleSheet(
  restaurantId: string,
  restaurantName: string,
  menus: ParsedMenuItem[],
  targetDate: string = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()),
): Promise<void> {
  const { spreadsheetId, source, isDev } = getSpreadsheetResolution();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
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
    console.warn(
      `[Google Sheets] Credentials missing (spreadsheetId: ${spreadsheetId ? "present" : "missing"}, clientEmail: ${clientEmail ? "present" : "missing"}, privateKey: ${privateKey ? "present" : "missing"}). Skipping sheet update and logging output to console instead.`,
    );
    console.log(
      `[Google Sheets Payload] ${restaurantName} (${restaurantId}):`,
      JSON.stringify(menus, null, 2),
    );
    return;
  }

  console.log(
    `[Google Sheets] Updating ${isDev ? "DEV" : "PROD"} spreadsheet: ${spreadsheetId} (resolved from ${source})`,
  );
  console.log(`[Google Sheets] Authenticating service account: ${clientEmail}`);
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitles = (spreadsheet.data.sheets ?? [])
      .map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t));

    if (!sheetTitles.includes(restaurantId)) {
      console.log(
        `[Google Sheets] Tab '${restaurantId}' not found. Creating tab with headers...`,
      );
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: restaurantId,
                },
              },
            },
          ],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${restaurantId}!A1:F1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              "restaurantId",
              "restaurantName",
              "date",
              "item",
              "dietaryFlags",
              "lastUpdated",
            ],
          ],
        },
      });
    }
  } catch (err) {
    console.warn(
      `[Google Sheets] Could not check/create tab '${restaurantId}':`,
      err,
    );
  }

  const lastUpdated = new Date().toISOString();
  const rows = formatMenuRows(restaurantId, restaurantName, menus, lastUpdated);
  const clearRange = `${restaurantId}!A2:Z`;

  console.log(`[Google Sheets] Clearing existing sheet range ${clearRange}...`);
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: clearRange,
    });
  } catch {
    console.log(
      `[Google Sheets] Sheet range clear skipped or tab standard update.`,
    );
  }

  if (rows.length === 0) {
    console.log(
      `[Google Sheets] No menu items found for ${restaurantName} (${restaurantId}) on ${targetDate}. Sheet range cleared and no rows added.`,
    );
    return;
  }

  console.log(
    `[Google Sheets] Writing ${rows.length} rows for ${restaurantName} starting at A2...`,
  );
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${restaurantId}!A2`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rows,
    },
  });

  console.log(
    `[Google Sheets] Successfully updated sheet for ${restaurantName}.`,
  );
}

export function formatOpeningHoursRows(
  openingHoursList: RestaurantOpeningHours[],
  lastUpdated: string = new Date().toISOString(),
): string[][] {
  return openingHoursList.map((item) => [
    item.restaurantId,
    item.restaurantName,
    item.openHours ?? "",
    item.lunchHours ?? "",
    item.rawText ?? "",
    item.lastUpdated || lastUpdated,
  ]);
}

export async function updateGoogleSheetOpeningHours(
  openingHoursList: RestaurantOpeningHours[],
): Promise<void> {
  const { spreadsheetId, source } = getOpeningHoursSpreadsheetResolution();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
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
    console.warn(
      `[Google Sheets Opening Hours] Credentials missing (spreadsheetId: ${spreadsheetId ? "present" : "missing"}, clientEmail: ${clientEmail ? "present" : "missing"}, privateKey: ${privateKey ? "present" : "missing"}). Skipping sheet update and logging output to console instead.`,
    );
    console.log(
      `[Google Sheets Opening Hours Payload]:`,
      JSON.stringify(openingHoursList, null, 2),
    );
    return;
  }

  console.log(
    `[Google Sheets Opening Hours] Updating spreadsheet: ${spreadsheetId} (resolved from ${source})`,
  );
  console.log(
    `[Google Sheets Opening Hours] Authenticating service account: ${clientEmail}`,
  );
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const tabName = "opening-hours";

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitles = (spreadsheet.data.sheets ?? [])
      .map((s) => s.properties?.title)
      .filter((t): t is string => Boolean(t));

    const targetTab = tabName;
    if (!sheetTitles.includes(tabName)) {
      if (sheetTitles.length === 1 && sheetTitles[0] === "Sheet1") {
        // If there's only the default Sheet1, rename it to opening-hours
        const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId;
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                updateSheetProperties: {
                  properties: {
                    sheetId,
                    title: tabName,
                  },
                  fields: "title",
                },
              },
            ],
          },
        });
      } else {
        console.log(
          `[Google Sheets Opening Hours] Tab '${tabName}' not found. Creating tab with headers...`,
        );
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: tabName,
                  },
                },
              },
            ],
          },
        });
      }
    }

    // Ensure header row is set
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${targetTab}!A1:F1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            "restaurantId",
            "restaurantName",
            "openHours",
            "lunchHours",
            "rawText",
            "lastUpdated",
          ],
        ],
      },
    });

    const rows = formatOpeningHoursRows(openingHoursList);
    const clearRange = `${targetTab}!A2:Z`;

    console.log(
      `[Google Sheets Opening Hours] Clearing existing sheet range ${clearRange}...`,
    );
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: clearRange,
      });
    } catch {
      // ignore
    }

    if (rows.length > 0) {
      console.log(
        `[Google Sheets Opening Hours] Writing ${rows.length} rows starting at A2...`,
      );
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${targetTab}!A2`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: rows,
        },
      });
      console.log(
        `[Google Sheets Opening Hours] Successfully updated opening hours sheet.`,
      );
    }
  } catch (err) {
    console.error(`[Google Sheets Opening Hours] Error updating sheet:`, err);
  }
}
