import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ParsedMenuItem } from "@acme/shared-types";

import { formatCategoryRows, formatMenuRows } from "./sheets.js";

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

void describe("formatCategoryRows", () => {
  void it("formats categories into 2D rows correctly", () => {
    const categories = [
      {
        id: "kala",
        label: "Kala",
        icon: "fish",
        items: [
          {
            restaurantId: "huoltamo",
            restaurantName: "Huoltamo",
            item: "Lohikeitto",
            dietaryFlags: ["L", "G"],
          },
        ],
      },
      {
        id: "burgeri",
        label: "Burgeri",
        icon: "burger",
        items: [
          {
            restaurantId: "iso-paja",
            restaurantName: "Iso Paja",
            item: "Smash burger",
            dietaryFlags: ["L"],
          },
        ],
      },
    ];

    const timestamp = "2026-08-24T10:00:00.000Z";
    const rows = formatCategoryRows(categories, "2026-08-24", timestamp);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], [
      "kala",
      "Kala",
      "2026-08-24",
      "huoltamo",
      "Huoltamo",
      "Lohikeitto",
      "L, G",
      timestamp,
    ]);
    assert.deepEqual(rows[1], [
      "burgeri",
      "Burgeri",
      "2026-08-24",
      "iso-paja",
      "Iso Paja",
      "Smash burger",
      "L",
      timestamp,
    ]);
  });
});
