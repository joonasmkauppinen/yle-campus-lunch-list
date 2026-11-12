import { describe, it, expect } from "vitest";
import type { Restaurant } from "@acme/shared-types";
import { resolveMenuDate, selectRestaurantMenus } from "./menu-selection";
import { getAvailableDishTags, getDishesForTag } from "./dish-tags";

const restaurant: Restaurant = {
  id: "huoltamo",
  name: "Huoltamo",
  lastUpdated: "",
  menus: [
    { date: "2026-11-13", items: [{ name: "Friday fish", tags: ["fish"] }] },
    {
      date: "2026-11-14",
      items: [{ name: "Saturday chicken", tags: ["chicken"] }],
    },
  ],
};
describe("date selection", () => {
  it("defaults fresh, invalid and out-of-week visits to today, preserving weekend links", () => {
    for (const requested of [null, "invalid", "2026-11-22"])
      expect(resolveMenuDate(requested, "2026-11-12")).toBe("2026-11-12");
    expect(resolveMenuDate("2026-11-14", "2026-11-12")).toBe("2026-11-14");
    expect(resolveMenuDate(null, "2026-11-15")).toBe("2026-11-15");
  });
  it("keeps AI suggestions and counts on the selected date without mutating weekly data", () => {
    const selected = selectRestaurantMenus([restaurant], "2026-11-14");
    expect(
      getAvailableDishTags(selected).map(({ config, count }) => [
        config.id,
        count,
      ]),
    ).toEqual([["chicken", 1]]);
    expect(getDishesForTag(selected, "fish")).toEqual([]);
    expect(restaurant.menus).toHaveLength(2);
    expect(selectRestaurantMenus([restaurant], "2026-11-15")[0]?.menus).toEqual(
      [],
    );
  });
});
