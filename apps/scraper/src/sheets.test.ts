import assert from "node:assert/strict";
import { describe, it } from "node:test";

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

void describe("formatMenuRows", () => {
  void it("returns an empty array when menus is empty", () => {
    const rows = formatMenuRows("huoltamo", "Huoltamo", []);
    assert.deepEqual(rows, []);
  });

  void it("formats parsed menu items into sheet rows correctly", () => {
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

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], [
      "huoltamo",
      "Huoltamo",
      "2026-08-21",
      "Lohikeitto",
      "G, L",
      timestamp,
    ]);
    assert.deepEqual(rows[1], [
      "huoltamo",
      "Huoltamo",
      "2026-08-21",
      "Kasvispihvit",
      "VEG, G",
      timestamp,
    ]);
  });
});

void describe("formatOpeningHoursRows", () => {
  void it("formats opening hours list into sheet rows correctly", () => {
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
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], [
      "huoltamo",
      "Huoltamo",
      "07:30 - 15:00",
      "10:30 - 13:30",
      "Avoinna ma-pe 07:30 - 15:00, lounas 10:30 - 13:30",
      "2026-08-21T10:00:00.000Z",
    ]);
  });
});

void describe("updateGoogleSheet dry run", () => {
  void it("skips Google Sheets API calls and completes successfully when dryRun is true", async () => {
    const sampleMenus: ParsedMenuItem[] = [
      {
        date: "2026-08-21",
        item: "Lohikeitto",
        dietaryFlags: ["G", "L"],
      },
    ];

    // Even if credentials exist or do not exist, dryRun should return cleanly without making API calls
    await assert.doesNotReject(async () => {
      await updateGoogleSheet(
        "huoltamo",
        "Huoltamo",
        sampleMenus,
        "2026-08-21",
        { dryRun: true },
      );
    });
  });
});

void describe("updateGoogleSheetOpeningHours dry run", () => {
  void it("skips Google Sheets API calls and completes successfully when dryRun is true", async () => {
    const sampleHours: RestaurantOpeningHours[] = [
      {
        restaurantId: "huoltamo",
        restaurantName: "Huoltamo",
        openHours: "07:30 - 15:00",
        lunchHours: "10:30 - 13:30",
        lastUpdated: "2026-08-21T10:00:00.000Z",
      },
    ];

    await assert.doesNotReject(async () => {
      await updateGoogleSheetOpeningHours(sampleHours, { dryRun: true });
    });
  });
});
