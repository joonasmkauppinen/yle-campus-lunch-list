import { describe, it, expect } from "vitest";
import { getWeekDates, isIsoDate } from "@acme/shared-types";
import { groupMenuRows } from "./menu-rows";

const row = (date: string, dish: string, tags = "") => [
  "huoltamo",
  "Huoltamo",
  date,
  dish,
  "G, L",
  "2026-11-12T08:00:00Z",
  tags,
];

describe("weekly menu dates", () => {
  it("includes both weekend days and crosses the year boundary", () => {
    expect(getWeekDates("2027-01-03")).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });
  it("uses calendar arithmetic through DST changes and validates dates", () => {
    expect(getWeekDates("2026-03-29")).toHaveLength(7);
    expect(getWeekDates("2026-10-25")[6]).toBe("2026-10-25");
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(() => getWeekDates("invalid")).toThrow();
  });
});

describe("groupMenuRows", () => {
  it("keeps dates and line order separate, including weekend menus", () => {
    const menus = groupMenuRows([
      row("2026-11-15", "Sunday soup", "fish, soup"),
      row("2026-11-14", "Saturday main"),
      row("2026-11-14", "Saturday side"),
      row("bad", "invalid"),
    ]);
    expect(menus.map((menu) => menu.date)).toEqual([
      "2026-11-14",
      "2026-11-15",
    ]);
    expect(menus[0]?.items.map((item) => item.name)).toEqual([
      "Saturday main",
      "Saturday side",
    ]);
    expect(menus[1]?.items[0]?.tags).toEqual(["fish", "soup"]);
  });
  it("includes closed days without dishes and freshness for retained data", () => {
    const menus = groupMenuRows(
      [row("2026-11-14", "Retained menu")],
      [
        ["huoltamo", "2026-11-14", "failed", "checked", "last-good"],
        ["huoltamo", "2026-11-15", "closed", "checked", "last-good"],
        ["other", "2026-11-13", "closed"],
      ],
      "huoltamo",
    );
    expect(menus).toHaveLength(2);
    expect(menus[0]).toMatchObject({
      availability: "failed",
      lastSuccess: "last-good",
    });
    expect(menus[1]).toMatchObject({ availability: "closed", items: [] });
  });
});
