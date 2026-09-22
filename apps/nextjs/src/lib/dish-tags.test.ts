import { describe, expect, it } from "vitest";

import type { MenuItem, Restaurant } from "@acme/shared-types";

import {
  getAvailableDishTags,
  getDishesForTag,
  parseDishTags,
} from "./dish-tags";

function restaurant(id: string, name: string, items: MenuItem[]): Restaurant {
  return {
    id,
    name,
    menus: [{ date: "2026-09-23", items }],
    lastUpdated: "2026-09-23T10:00:00.000Z",
  };
}

describe("parseDishTags", () => {
  it("parses the comma-separated column the scraper writes", () => {
    expect(parseDishTags("fish, soup")).toEqual(["fish", "soup"]);
  });

  it("tolerates a missing or empty column", () => {
    // A sheet written by an older scraper has no seventh column at all.
    expect(parseDishTags(undefined)).toEqual([]);
    expect(parseDishTags("")).toEqual([]);
    expect(parseDishTags("   ")).toEqual([]);
    expect(parseDishTags(",, ,")).toEqual([]);
  });

  it("drops ids outside the vocabulary but keeps the rest", () => {
    // Removing a tag from the vocabulary must not break the page before the
    // sheet is rewritten.
    expect(parseDishTags("fish, sushi, soup")).toEqual(["fish", "soup"]);
    expect(parseDishTags("not-a-tag")).toEqual([]);
  });

  it("normalises casing and surrounding whitespace, and de-duplicates", () => {
    expect(parseDishTags("  FISH ,fish,  Tex-Mex ")).toEqual([
      "fish",
      "tex-mex",
    ]);
  });
});

describe("getAvailableDishTags", () => {
  const restaurants = [
    restaurant("huoltamo", "Huoltamo", [
      { name: "Lohikeitto", tags: ["fish", "soup"] },
      { name: "Broileriwok", tags: ["chicken", "asian"] },
      { name: "Huomioimme erikoisruokavaliot" },
    ]),
    restaurant("iso-paja", "Iso Paja", [
      { name: "Kalakeitto", tags: ["fish", "soup"] },
      { name: "Pizza Margherita", tags: ["pizza", "vegetarian"] },
    ]),
  ];

  it("returns only tags with matches, counted across every restaurant", () => {
    const available = getAvailableDishTags(restaurants);
    const counts = Object.fromEntries(
      available.map(({ config, count }) => [config.id, count]),
    );

    expect(counts).toEqual({
      chicken: 1,
      fish: 2,
      vegetarian: 1,
      soup: 2,
      pizza: 1,
      asian: 1,
    });
  });

  it("omits tags nobody is serving, so every button leads somewhere", () => {
    const ids = getAvailableDishTags(restaurants).map(
      ({ config }) => config.id,
    );

    expect(ids).not.toContain("burger");
    expect(ids).not.toContain("indian");
  });

  it("returns the tags in configured order rather than match order", () => {
    const ids = getAvailableDishTags(restaurants).map(
      ({ config }) => config.id,
    );

    // Configured order is meat, chicken, fish, vegetarian, ... soup ... pizza ... asian.
    expect(ids).toEqual([
      "chicken",
      "fish",
      "vegetarian",
      "soup",
      "pizza",
      "asian",
    ]);
  });

  it("returns nothing when no menu item carries tags", () => {
    const untagged = [
      restaurant("huoltamo", "Huoltamo", [{ name: "Päivän keitto" }]),
    ];

    expect(getAvailableDishTags(untagged)).toEqual([]);
  });
});

describe("getDishesForTag", () => {
  const restaurants = [
    restaurant("huoltamo", "Huoltamo", [
      { name: "Lohikeitto", tags: ["fish", "soup"] },
      { name: "Broileriwok", tags: ["chicken", "asian"] },
    ]),
    restaurant("piccolo", "Piccolo", [{ name: "Pizza", tags: ["pizza"] }]),
    restaurant("iso-paja", "Iso Paja", [
      { name: "Kalakeitto", tags: ["fish", "soup"] },
      { name: "Silakat", tags: ["fish"] },
    ]),
  ];

  it("groups matches by restaurant, keeping the order they arrive in", () => {
    const groups = getDishesForTag(restaurants, "fish");

    expect(groups.map((g) => g.restaurantId)).toEqual(["huoltamo", "iso-paja"]);
    expect(groups[1]?.restaurantName).toBe("Iso Paja");
    expect(groups[1]?.items.map((i) => i.name)).toEqual([
      "Kalakeitto",
      "Silakat",
    ]);
  });

  it("omits restaurants with no match rather than listing them empty", () => {
    const groups = getDishesForTag(restaurants, "fish");

    expect(groups.map((g) => g.restaurantId)).not.toContain("piccolo");
  });

  it("returns a dish under every tag it carries", () => {
    // A dish that is both chicken and Asian is findable either way.
    expect(getDishesForTag(restaurants, "chicken")[0]?.items[0]?.name).toBe(
      "Broileriwok",
    );
    expect(getDishesForTag(restaurants, "asian")[0]?.items[0]?.name).toBe(
      "Broileriwok",
    );
  });

  it("returns nothing for a tag with no matches", () => {
    expect(getDishesForTag(restaurants, "burger")).toEqual([]);
  });
});
