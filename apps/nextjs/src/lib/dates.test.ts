import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatDisplayDate,
  getOpeningHoursForCurrentDay,
  getTodayFormattedString,
  isCurrentDate,
} from "./dates";

void describe("dates utilities", () => {
  void it("formatDisplayDate formats ISO date correctly", () => {
    assert.equal(formatDisplayDate("2026-08-23"), "23.8.2026");
    assert.equal(formatDisplayDate("2026-01-05"), "5.1.2026");
  });

  void it("getTodayFormattedString returns non-empty formatted date", () => {
    const formatted = getTodayFormattedString(new Date("2026-08-24T12:00:00Z"));
    assert.ok(formatted.includes("24.8.2026"));
  });

  void it("isCurrentDate returns true for today", () => {
    const todayIso = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Helsinki",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    assert.equal(isCurrentDate(todayIso), true);
    assert.equal(isCurrentDate("1999-01-01"), false);
  });
});

void describe("getOpeningHoursForCurrentDay", () => {
  const monday = new Date("2026-08-24T10:00:00Z");
  const wednesday = new Date("2026-08-26T10:00:00Z");
  const saturday = new Date("2026-08-29T10:00:00Z");
  const sunday = new Date("2026-08-23T10:00:00Z");

  void it("handles multi-schedule strings (Huoltamo)", () => {
    const str = "Ma–pe 10.30–17.30, la–su 12.00–17.30";
    assert.equal(getOpeningHoursForCurrentDay(str, monday), "10.30–17.30");
    assert.equal(getOpeningHoursForCurrentDay(str, wednesday), "10.30–17.30");
    assert.equal(getOpeningHoursForCurrentDay(str, saturday), "12.00–17.30");
    assert.equal(getOpeningHoursForCurrentDay(str, sunday), "12.00–17.30");
  });

  void it("handles weekday-only strings (Studio 10, Pasilan Linkki)", () => {
    const str = "Ma–pe 10.45–14.00";
    assert.equal(getOpeningHoursForCurrentDay(str, monday), "10.45–14.00");
    assert.equal(getOpeningHoursForCurrentDay(str, wednesday), "10.45–14.00");
    assert.equal(getOpeningHoursForCurrentDay(str, saturday), "Suljettu");
    assert.equal(getOpeningHoursForCurrentDay(str, sunday), "Suljettu");
  });

  void it("handles 24/7 strings (Piccolo open hours)", () => {
    const str = "24/7 (Itsepalvelu)";
    assert.equal(
      getOpeningHoursForCurrentDay(str, monday),
      "24/7 (Itsepalvelu)",
    );
    assert.equal(
      getOpeningHoursForCurrentDay(str, sunday),
      "24/7 (Itsepalvelu)",
    );
  });

  void it("handles plain time strings", () => {
    const str = "10.30–14.00";
    assert.equal(getOpeningHoursForCurrentDay(str, monday), "10.30–14.00");
    assert.equal(getOpeningHoursForCurrentDay(str, sunday), "Suljettu");
  });

  void it("handles empty or undefined strings gracefully", () => {
    assert.equal(getOpeningHoursForCurrentDay(undefined), null);
    assert.equal(getOpeningHoursForCurrentDay(""), null);
    assert.equal(getOpeningHoursForCurrentDay("   "), null);
  });
});
