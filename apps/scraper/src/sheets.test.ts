import { describe, expect, it } from "vitest";

import type {
  ParsedMenuItem,
  RestaurantOpeningHours,
} from "@acme/shared-types";

import {
  formatMenuRows,
  formatOpeningHoursRows,
  updateGoogleSheet,
  updateGoogleSheetOpeningHours,
} from "./sheets.js";

describe("formatMenuRows", () => {
  it("returns an empty array when menus is empty", () => {
    const rows = formatMenuRows("huoltamo", "Huoltamo", []);
    expect(rows).toEqual([]);
  });

  it("formats parsed menu items into sheet rows correctly", () => {
    const sampleMenus: ParsedMenuItem[] = [
      {
        date: "2026-08-21",
        item: "Lohikeitto",
        dietaryFlags: ["G", "L"],
      },
      {
        date: "2026-08-21",
        item: "Kasvispihvit",
        dietaryFlags: ["VEG", "G"],
      },
    ];

    const timestamp = "2026-08-21T10:00:00.000Z";
    const rows = formatMenuRows("huoltamo", "Huoltamo", sampleMenus, timestamp);

    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual([
      "huoltamo",
      "Huoltamo",
      "2026-08-21",
      "Lohikeitto",
      "G, L",
      timestamp,
    ]);
    expect(rows[1]).toEqual([
      "huoltamo",
      "Huoltamo",
      "2026-08-21",
      "Kasvispihvit",
      "VEG, G",
      timestamp,
    ]);
  });
});

describe("formatOpeningHoursRows", () => {
  it("formats opening hours list into sheet rows correctly", () => {
    const sampleHours: RestaurantOpeningHours[] = [
      {
        restaurantId: "huoltamo",
        restaurantName: "Huoltamo",
        openHours: "07:30 - 15:00",
        lunchHours: "10:30 - 13:30",
        rawText: "Avoinna ma-pe 07:30 - 15:00, lounas 10:30 - 13:30",
        lastUpdated: "2026-08-21T10:00:00.000Z",
      },
    ];

    const rows = formatOpeningHoursRows(sampleHours);
    expect(rows.length).toBe(1);
    expect(rows[0]).toEqual([
      "huoltamo",
      "Huoltamo",
      "07:30 - 15:00",
      "10:30 - 13:30",
      "Avoinna ma-pe 07:30 - 15:00, lounas 10:30 - 13:30",
      "2026-08-21T10:00:00.000Z",
    ]);
  });
});

describe("updateGoogleSheet dry run", () => {
  it("skips Google Sheets API calls and completes successfully when dryRun is true", async () => {
    const sampleMenus: ParsedMenuItem[] = [
      {
        date: "2026-08-21",
        item: "Lohikeitto",
        dietaryFlags: ["G", "L"],
      },
    ];

    await expect(
      updateGoogleSheet("huoltamo", "Huoltamo", sampleMenus, "2026-08-21", {
        dryRun: true,
      }),
    ).resolves.not.toThrow();
  });
});

describe("updateGoogleSheetOpeningHours dry run", () => {
  it("skips Google Sheets API calls and completes successfully when dryRun is true", async () => {
    const sampleHours: RestaurantOpeningHours[] = [
      {
        restaurantId: "huoltamo",
        restaurantName: "Huoltamo",
        openHours: "07:30 - 15:00",
        lunchHours: "10:30 - 13:30",
        lastUpdated: "2026-08-21T10:00:00.000Z",
      },
    ];

    await expect(
      updateGoogleSheetOpeningHours(sampleHours, { dryRun: true }),
    ).resolves.not.toThrow();
  });
});
