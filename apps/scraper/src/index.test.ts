import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveTargetDate } from "./index.js";

void describe("resolveTargetDate", () => {
  void it("parses --date flag with separate argument", () => {
    assert.equal(resolveTargetDate(["--date", "2026-08-21"]), "2026-08-21");
    assert.equal(resolveTargetDate(["-d", "2026-08-20"]), "2026-08-20");
  });

  void it("parses --date= flag with equal sign", () => {
    assert.equal(resolveTargetDate(["--date=2026-08-21"]), "2026-08-21");
    assert.equal(resolveTargetDate(["-d=2026-08-20"]), "2026-08-20");
  });

  void it("parses positional date argument", () => {
    assert.equal(resolveTargetDate(["2026-08-21"]), "2026-08-21");
  });

  void it("falls back to env variables when no CLI args provided", () => {
    const originalTargetDate = process.env.TARGET_DATE;
    const originalDate = process.env.DATE;

    try {
      process.env.TARGET_DATE = "2026-08-19";
      assert.equal(resolveTargetDate([]), "2026-08-19");

      delete process.env.TARGET_DATE;
      process.env.DATE = "2026-08-18";
      assert.equal(resolveTargetDate([]), "2026-08-18");
    } finally {
      process.env.TARGET_DATE = originalTargetDate;
      process.env.DATE = originalDate;
    }
  });

  void it("falls back to today in Helsinki timezone if no args or env specified", () => {
    const originalTargetDate = process.env.TARGET_DATE;
    const originalDate = process.env.DATE;
    const originalScrapeDate = process.env.SCRAPE_DATE;

    try {
      delete process.env.TARGET_DATE;
      delete process.env.DATE;
      delete process.env.SCRAPE_DATE;

      const dateStr = resolveTargetDate([]);
      assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
    } finally {
      process.env.TARGET_DATE = originalTargetDate;
      process.env.DATE = originalDate;
      process.env.SCRAPE_DATE = originalScrapeDate;
    }
  });
});
