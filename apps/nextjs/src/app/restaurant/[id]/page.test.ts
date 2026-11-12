import { Children, isValidElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Restaurant } from "@acme/shared-types";

vi.mock("~/lib/sheets", () => ({ fetchRestaurantsFromGoogleSheets: vi.fn() }));
vi.mock("~/components/menu-date", () => ({
  MenuDateProvider: "menu-date-provider",
}));
vi.mock("~/components/restaurant-detail", () => ({
  RestaurantDetail: "restaurant-detail",
}));

import RestaurantPage from "./page";
import { fetchRestaurantsFromGoogleSheets } from "~/lib/sheets";

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function pageSchema(menus: Restaurant["menus"]) {
  vi.useFakeTimers();
  // Friday UTC, but already Saturday in Helsinki.
  vi.setSystemTime(new Date("2026-11-13T22:30:00Z"));
  vi.mocked(fetchRestaurantsFromGoogleSheets).mockResolvedValue({
    isDev: true,
    restaurants: [
      {
        id: "huoltamo",
        name: "Huoltamo",
        menus,
        lastUpdated: "",
      },
    ],
  });
  const page = await RestaurantPage({
    params: Promise.resolve({ id: "huoltamo" }),
  });
  const script = Children.toArray(page.props.children).find(
    (child) => isValidElement(child) && child.type === "script",
  );
  if (!isValidElement<{ dangerouslySetInnerHTML: { __html: string } }>(script))
    throw new Error("Restaurant JSON-LD script missing");
  return JSON.parse(script.props.dangerouslySetInnerHTML.__html) as {
    "@type": string;
    name: string;
    hasMenu?: {
      name: string;
      hasMenuItem: { name: string; suitableForDiet?: string | string[] }[];
    };
  };
}

describe("Restaurant page structured data", () => {
  it("includes only today's Helsinki menu from the weekly dataset", async () => {
    const schema = await pageSchema([
      { date: "2026-11-13", items: [{ name: "Friday menu" }] },
      {
        date: "2026-11-14",
        items: [{ name: "Saturday soup", dietaryFlags: ["G"] }],
      },
      { date: "2026-11-15", items: [{ name: "Sunday menu" }] },
    ]);
    expect(schema["@type"]).toBe("Restaurant");
    expect(schema.hasMenu?.name).toContain("2026-11-14");
    expect(schema.hasMenu?.hasMenuItem).toEqual([
      {
        "@type": "MenuItem",
        name: "Saturday soup",
        suitableForDiet: "https://schema.org/GlutenFreeDiet",
      },
    ]);
  });
  it("retains Restaurant metadata without substituting another day's menu", async () => {
    const schema = await pageSchema([
      { date: "2026-11-13", items: [{ name: "Yesterday" }] },
    ]);
    expect(schema.name).toBe("Huoltamo");
    expect(schema).not.toHaveProperty("hasMenu");
  });
  it("omits menu details when today's menu has no items", async () => {
    const schema = await pageSchema([{ date: "2026-11-14", items: [] }]);
    expect(schema).not.toHaveProperty("hasMenu");
  });
});
