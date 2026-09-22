import { describe, expect, it } from "vitest";

import { resolveIsDryRun, resolveTargetDate } from "./index.js";

describe("resolveTargetDate", () => {
  it("parses --date flag with separate argument", () => {
    expect(resolveTargetDate(["--date", "2026-08-21"])).toBe("2026-08-21");
    expect(resolveTargetDate(["-d", "2026-08-20"])).toBe("2026-08-20");
  });

  it("parses --date= flag with equal sign", () => {
    expect(resolveTargetDate(["--date=2026-08-21"])).toBe("2026-08-21");
    expect(resolveTargetDate(["-d=2026-08-20"])).toBe("2026-08-20");
  });

  it("parses positional date argument", () => {
    expect(resolveTargetDate(["2026-08-21"])).toBe("2026-08-21");
  });

  it("falls back to env variables when no CLI args provided", () => {
    const originalTargetDate = process.env.TARGET_DATE;
    const originalDate = process.env.DATE;

    try {
      process.env.TARGET_DATE = "2026-08-19";
      expect(resolveTargetDate([])).toBe("2026-08-19");

      delete process.env.TARGET_DATE;
      process.env.DATE = "2026-08-18";
      expect(resolveTargetDate([])).toBe("2026-08-18");
    } finally {
      process.env.TARGET_DATE = originalTargetDate;
      process.env.DATE = originalDate;
    }
  });

  it("falls back to today in Helsinki timezone if no args or env specified", () => {
    const originalTargetDate = process.env.TARGET_DATE;
    const originalDate = process.env.DATE;
    const originalScrapeDate = process.env.SCRAPE_DATE;

    try {
      delete process.env.TARGET_DATE;
      delete process.env.DATE;
      delete process.env.SCRAPE_DATE;

      const dateStr = resolveTargetDate([]);
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    } finally {
      process.env.TARGET_DATE = originalTargetDate;
      process.env.DATE = originalDate;
      process.env.SCRAPE_DATE = originalScrapeDate;
    }
  });
});

describe("resolveIsDryRun", () => {
  it("parses --dry-run, --dryrun, and -n flags", () => {
    expect(resolveIsDryRun(["--dry-run"])).toBe(true);
    expect(resolveIsDryRun(["--dryrun"])).toBe(true);
    expect(resolveIsDryRun(["-n"])).toBe(true);
    expect(resolveIsDryRun(["--date", "2026-08-21", "--dry-run"])).toBe(true);
  });

  it("parses --dry-run= flag with boolean values", () => {
    expect(resolveIsDryRun(["--dry-run=true"])).toBe(true);
    expect(resolveIsDryRun(["--dry-run=1"])).toBe(true);
    expect(resolveIsDryRun(["--dry-run=yes"])).toBe(true);
    expect(resolveIsDryRun(["--dry-run=false"])).toBe(false);
    expect(resolveIsDryRun(["--dryrun=true"])).toBe(true);
  });

  it("falls back to DRY_RUN env variable", () => {
    const originalDryRun = process.env.DRY_RUN;

    try {
      process.env.DRY_RUN = "true";
      expect(resolveIsDryRun([])).toBe(true);

      process.env.DRY_RUN = "1";
      expect(resolveIsDryRun([])).toBe(true);

      process.env.DRY_RUN = "yes";
      expect(resolveIsDryRun([])).toBe(true);

      process.env.DRY_RUN = "false";
      expect(resolveIsDryRun([])).toBe(false);

      process.env.DRY_RUN = "0";
      expect(resolveIsDryRun([])).toBe(false);
    } finally {
      process.env.DRY_RUN = originalDryRun;
    }
  });

  it("returns false when no flag or env var is provided", () => {
    const originalDryRun = process.env.DRY_RUN;

    try {
      delete process.env.DRY_RUN;
      expect(resolveIsDryRun([])).toBe(false);
      expect(resolveIsDryRun(["--date", "2026-08-21"])).toBe(false);
    } finally {
      process.env.DRY_RUN = originalDryRun;
    }
  });
});
