import { describe, expect, it } from "vitest";

import {
  formatDisplayDate,
  getOpeningHoursForCurrentDay,
  getTodayFormattedString,
  isCurrentDate,
} from "./dates";

describe("dates utilities", () => {
  it("formatDisplayDate formats ISO date correctly", () => {
    expect(formatDisplayDate("2026-08-23")).toBe("23.8.2026");
    expect(formatDisplayDate("2026-01-05")).toBe("5.1.2026");
  });

  it("getTodayFormattedString returns non-empty formatted date", () => {
    const formatted = getTodayFormattedString(new Date("2026-08-24T12:00:00Z"));
    expect(formatted).toContain("24.8.2026");
  });

  it("isCurrentDate returns true for today", () => {
    const todayIso = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Helsinki",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    expect(isCurrentDate(todayIso)).toBe(true);
    expect(isCurrentDate("1999-01-01")).toBe(false);
  });
});

describe("getOpeningHoursForCurrentDay", () => {
  const monday = new Date("2026-08-24T10:00:00Z");
  const wednesday = new Date("2026-08-26T10:00:00Z");
  const saturday = new Date("2026-08-29T10:00:00Z");
  const sunday = new Date("2026-08-23T10:00:00Z");

  it("handles multi-schedule strings (Huoltamo)", () => {
    const str = "Ma–pe 10.30–17.30, la–su 12.00–17.30";
    expect(getOpeningHoursForCurrentDay(str, monday)).toBe("10.30–17.30");
    expect(getOpeningHoursForCurrentDay(str, wednesday)).toBe("10.30–17.30");
    expect(getOpeningHoursForCurrentDay(str, saturday)).toBe("12.00–17.30");
    expect(getOpeningHoursForCurrentDay(str, sunday)).toBe("12.00–17.30");
  });

  it("handles weekday-only strings (Studio 10, Pasilan Linkki)", () => {
    const str = "Ma–pe 10.45–14.00";
    expect(getOpeningHoursForCurrentDay(str, monday)).toBe("10.45–14.00");
    expect(getOpeningHoursForCurrentDay(str, wednesday)).toBe("10.45–14.00");
    expect(getOpeningHoursForCurrentDay(str, saturday)).toBe("Suljettu");
    expect(getOpeningHoursForCurrentDay(str, sunday)).toBe("Suljettu");
  });

  it("handles 24/7 strings (Piccolo open hours)", () => {
    const str = "24/7 (Itsepalvelu)";
    expect(getOpeningHoursForCurrentDay(str, monday)).toBe(
      "24/7 (Itsepalvelu)",
    );
    expect(getOpeningHoursForCurrentDay(str, sunday)).toBe(
      "24/7 (Itsepalvelu)",
    );
  });

  it("handles plain time strings", () => {
    const str = "10.30–14.00";
    expect(getOpeningHoursForCurrentDay(str, monday)).toBe("10.30–14.00");
    expect(getOpeningHoursForCurrentDay(str, sunday)).toBe("Suljettu");
  });

  it("handles empty or undefined strings gracefully", () => {
    expect(getOpeningHoursForCurrentDay(undefined)).toBeNull();
    expect(getOpeningHoursForCurrentDay("")).toBeNull();
    expect(getOpeningHoursForCurrentDay("   ")).toBeNull();
  });
});
