import { google } from "googleapis";

import type { ParsedMenuItem } from "@acme/shared-types";

import { getSpreadsheetResolution } from "./env.js";

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
