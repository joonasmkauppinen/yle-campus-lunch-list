import { describe, it, expect } from "vitest";
import { getSwipeDay } from "./menu-swipe";

describe("menu swipe navigation", () => {
  it("moves left to the next day and right to the previous day, including weekends", () => {
    expect(getSwipeDay("2026-11-13", -100, 10, 300)).toBe("2026-11-14");
    expect(getSwipeDay("2026-11-14", -100, 10, 300)).toBe("2026-11-15");
    expect(getSwipeDay("2026-11-14", 100, -10, 300)).toBe("2026-11-13");
  });
  it("does not wrap at either end of the week", () => {
    expect(getSwipeDay("2026-11-09", 100, 0, 300)).toBeNull();
    expect(getSwipeDay("2026-11-15", -100, 0, 300)).toBeNull();
  });
  it("ignores taps, short drags, vertical/diagonal scrolling and long gestures", () => {
    for (const [x, y, duration] of [
      [0, 0, 100],
      [40, 0, 200],
      [70, 100, 200],
      [70, 60, 200],
      [100, 0, 1000],
    ]) {
      expect(
        getSwipeDay("2026-11-12", x ?? 0, y ?? 0, duration ?? 0),
      ).toBeNull();
    }
  });
});
