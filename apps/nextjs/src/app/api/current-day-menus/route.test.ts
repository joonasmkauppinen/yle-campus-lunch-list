import { afterEach, describe, it, expect, vi } from "vitest";
vi.mock("~/lib/sheets", () => ({ fetchRestaurantsFromGoogleSheets: vi.fn() }));
import { transformToLegacyRestaurantMenus } from "./route";
afterEach(() => vi.useRealTimers());

describe("legacy current-day API", () => {
  it("selects today from a multi-day sheet even on a Helsinki weekend", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T22:30:00Z"));
    const menus = transformToLegacyRestaurantMenus([
      {
        id: "huoltamo",
        name: "Huoltamo",
        lastUpdated: "",
        menus: [
          { date: "2026-11-13", items: [{ name: "Friday" }] },
          {
            date: "2026-11-14",
            items: [{ name: "Saturday", dietaryFlags: ["G"] }],
          },
          { date: "2026-11-15", items: [{ name: "Sunday" }] },
        ],
      },
    ]);
    expect(menus.huoltamo).toEqual([{ text: "Saturday (G)" }]);
    expect(menus.piccolo).toEqual([]);
  });
});
