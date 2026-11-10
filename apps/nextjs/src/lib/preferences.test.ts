import { describe, expect, it } from "vitest";

import type { AreaId, Restaurant } from "@acme/shared-types";

import type { RestaurantPreferences } from "./preferences";
import {
  getOrderedAreas,
  groupRestaurantsByArea,
  resolveDishTagsVisibility,
} from "./preferences";

function restaurant(id: string, area?: AreaId): Restaurant {
  return { id, name: id, area, menus: [], lastUpdated: "" };
}

const RESTAURANTS = [
  restaurant("huoltamo", "yle-campus"),
  restaurant("iso-paja", "yle-campus"),
  restaurant("akseli", "ilmala"),
  restaurant("piano", "pasila"),
  restaurant("unknown"),
];

function summarize(result: ReturnType<typeof groupRestaurantsByArea>) {
  return {
    groups: result.groups.map((g) => [
      g.area?.id ?? null,
      g.restaurants.map((r) => r.id),
    ]),
    hidden: result.hidden.map((r) => r.id),
  };
}

function prefs(partial: Partial<RestaurantPreferences>): RestaurantPreferences {
  return { order: [], hidden: [], ...partial };
}

describe("resolveDishTagsVisibility", () => {
  it("shows the section whenever the switch is on", () => {
    expect(resolveDishTagsVisibility("visible", true)).toBe("visible");
    expect(resolveDishTagsVisibility("hidden", true)).toBe("visible");
    expect(resolveDishTagsVisibility("dismissed", true)).toBe("visible");
  });

  it("hides without the info box when turned off from settings", () => {
    expect(resolveDishTagsVisibility("visible", false)).toBe("dismissed");
  });

  it("keeps an already hidden state when the switch stays off", () => {
    // Saving the modal for an unrelated change must not dismiss an info box
    // the user has not closed yet.
    expect(resolveDishTagsVisibility("hidden", false)).toBe("hidden");
    expect(resolveDishTagsVisibility("dismissed", false)).toBe("dismissed");
  });
});

describe("getOrderedAreas", () => {
  it("puts saved Areas first and keeps the rest in default order", () => {
    expect(getOrderedAreas(null).map((a) => a.id)).toEqual([
      "yle-campus",
      "ilmala",
      "pasila",
    ]);
    expect(
      getOrderedAreas(prefs({ areaOrder: ["pasila"] })).map((a) => a.id),
    ).toEqual(["pasila", "yle-campus", "ilmala"]);
  });
});

describe("groupRestaurantsByArea", () => {
  it("groups by Area in default order, with unconfigured restaurants last", () => {
    expect(summarize(groupRestaurantsByArea(RESTAURANTS, null))).toEqual({
      groups: [
        ["yle-campus", ["huoltamo", "iso-paja"]],
        ["ilmala", ["akseli"]],
        ["pasila", ["piano"]],
        [null, ["unknown"]],
      ],
      hidden: [],
    });
  });

  it("orders within Areas from a flat saved order made before Areas", () => {
    // An old cross-Area order still sorts each Area's restaurants correctly
    const result = groupRestaurantsByArea(
      RESTAURANTS,
      prefs({ order: ["piano", "iso-paja", "akseli", "huoltamo"] }),
    );
    expect(summarize(result).groups.slice(0, 3)).toEqual([
      ["yle-campus", ["iso-paja", "huoltamo"]],
      ["ilmala", ["akseli"]],
      ["pasila", ["piano"]],
    ]);
  });

  it("follows the saved Area order", () => {
    const result = groupRestaurantsByArea(
      RESTAURANTS,
      prefs({ areaOrder: ["pasila", "ilmala", "yle-campus"] }),
    );
    expect(summarize(result).groups.map(([area]) => area)).toEqual([
      "pasila",
      "ilmala",
      "yle-campus",
      null,
    ]);
  });

  it("hides restaurants of a hidden Area and drops emptied groups", () => {
    const result = groupRestaurantsByArea(
      RESTAURANTS,
      prefs({ hidden: ["piano"], hiddenAreas: ["yle-campus"] }),
    );
    expect(summarize(result)).toEqual({
      groups: [
        ["ilmala", ["akseli"]],
        [null, ["unknown"]],
      ],
      hidden: ["huoltamo", "iso-paja", "piano"],
    });
  });
});
