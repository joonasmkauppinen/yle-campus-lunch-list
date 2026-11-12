import { createHash } from "node:crypto";
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";
import type { ParsedMenuItem } from "@acme/shared-types";
import { getWeekDates } from "@acme/shared-types";
import { getSpreadsheetResolution } from "./env.js";
import { formatMenuRows } from "./sheets.js";
import { tagMenuItemsWithOutcome, taggingVersion } from "./tagging.js";
import type { ScrapedDay, Source } from "./weekly.js";

const STATUS_HEADERS = [
  "restaurantId",
  "date",
  "state",
  "lastChecked",
  "lastSuccess",
  "menuHash",
  "taggingVersion",
  "taggingOutcome",
];
const MENU_HEADERS = [
  "restaurantId",
  "restaurantName",
  "date",
  "item",
  "dietaryFlags",
  "lastUpdated",
  "tags",
];

export function menuHash(items: ParsedMenuItem[]): string {
  return createHash("sha256")
    .update(
      JSON.stringify(
        items.map(({ item, dietaryFlags }) => [item, dietaryFlags]),
      ),
    )
    .digest("hex");
}

export function reconcileDayRows(
  previous: string[][],
  fresh: string[][],
  day: ScrapedDay,
): string[][] {
  return day.state === "published" || day.state === "closed"
    ? [...previous.filter((row) => row[2] !== day.date), ...fresh]
    : previous;
}

function updateCells(
  sheetId: number,
  values: string[][],
  columns: number,
): sheets_v4.Schema$Request {
  return {
    updateCells: {
      range: {
        sheetId,
        startRowIndex: 0,
        startColumnIndex: 0,
        endColumnIndex: columns,
      },
      rows: values.map((row) => ({
        values: row.map((value) => ({
          userEnteredValue: { stringValue: value },
        })),
      })),
      fields: "userEnteredValue",
    },
  };
}

export async function createWeeklySync(dryRun: boolean, skipTagging = false) {
  const { spreadsheetId } = getSpreadsheetResolution();
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  // Dry runs never read or write Sheets, even when credentials are configured.
  const sheets =
    !dryRun && spreadsheetId && email && key
      ? google.sheets({
          version: "v4",
          auth: new google.auth.JWT({
            email,
            key,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          }),
        })
      : null;
  if (!dryRun && !sheets)
    throw new Error(
      "Google Sheets credentials are required for a live sync; use --dry-run for validation",
    );
  const sheetIds = new Map<string, number>();
  if (sheets) {
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    for (const sheet of metadata.data.sheets ?? []) {
      if (
        sheet.properties?.title &&
        sheet.properties.sheetId !== undefined &&
        sheet.properties.sheetId !== null
      )
        sheetIds.set(sheet.properties.title, sheet.properties.sheetId);
    }
  }
  async function ensureSheet(title: string): Promise<number> {
    const existing = sheetIds.get(title);
    if (existing !== undefined) return existing;
    if (!sheets) throw new Error("No Sheets client");
    const result = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
    const id = result.data.replies?.[0]?.addSheet?.properties?.sheetId;
    if (id === undefined || id === null)
      throw new Error(`Could not create ${title}`);
    sheetIds.set(title, id);
    return id;
  }

  return async (source: Source, days: ScrapedDay[], anchor: string) => {
    let previous: string[][] = [];
    let statuses: string[][] = [];
    let menuId = 0;
    let statusId = 0;
    if (sheets) {
      menuId = await ensureSheet(source.id);
      statusId = await ensureSheet("menu-status");
      const result = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: [`'${source.id}'!A2:G`, "'menu-status'!A2:H"],
      });
      previous = (result.data.valueRanges?.[0]?.values ?? []).map((row) =>
        row.map(String),
      );
      statuses = (result.data.valueRanges?.[1]?.values ?? []).map((row) =>
        row.map(String),
      );
    }
    const week = getWeekDates(anchor);
    let rows = previous.filter((row) => week.includes(row[2] ?? ""));
    const now = new Date().toISOString();
    const version = taggingVersion();
    for (const day of days) {
      const oldStatus = statuses.find(
        (row) => row[0] === source.id && row[1] === day.date,
      );
      const oldRows = rows.filter((row) => row[2] === day.date);
      const hash = menuHash(day.items);
      let taggingOutcome = "pending";
      let fresh: string[][] = [];
      if (day.state === "published") {
        if (
          oldStatus?.[5] === hash &&
          oldStatus[6] === version &&
          oldStatus[7] === "success" &&
          oldRows.length === day.items.length
        ) {
          fresh = oldRows;
          taggingOutcome = "success";
        } else {
          const tagged = skipTagging
            ? { items: day.items, success: false }
            : await tagMenuItemsWithOutcome(day.items, source.name);
          fresh = formatMenuRows(source.id, source.name, tagged.items, now);
          taggingOutcome = tagged.success ? "success" : "failed";
        }
      }
      rows = reconcileDayRows(rows, fresh, day);
      const authoritative = day.state === "published" || day.state === "closed";
      const status = [
        source.id,
        day.date,
        day.state,
        now,
        authoritative ? now : (oldStatus?.[4] ?? oldRows[0]?.[5] ?? ""),
        authoritative ? hash : (oldStatus?.[5] ?? ""),
        authoritative ? version : (oldStatus?.[6] ?? ""),
        authoritative ? taggingOutcome : (oldStatus?.[7] ?? "pending"),
      ];
      statuses = statuses.filter(
        (row) => !(row[0] === source.id && row[1] === day.date),
      );
      statuses.push(status);
    }
    statuses = statuses.filter(
      (row) => row[0] !== source.id || week.includes(row[1] ?? ""),
    );
    rows.sort((a, b) => (a[2] ?? "").localeCompare(b[2] ?? ""));
    if (!sheets) {
      console.log(
        `[DRY RUN] ${source.name}: ${JSON.stringify(days.map((day) => ({ date: day.date, state: day.state, items: day.items.length })))}`,
      );
      return;
    }
    // One atomic batch replaces rows + status; missing trailing cells are cleared.
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          updateCells(menuId, [MENU_HEADERS, ...rows], MENU_HEADERS.length),
          updateCells(
            statusId,
            [STATUS_HEADERS, ...statuses],
            STATUS_HEADERS.length,
          ),
        ],
      },
    });
  };
}
