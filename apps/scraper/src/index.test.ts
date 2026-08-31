import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveIsDryRun, resolveTargetDate } from "./index.js";

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

void describe("resolveIsDryRun", () => {
  void it("parses --dry-run, --dryrun, and -n flags", () => {
    assert.equal(resolveIsDryRun(["--dry-run"]), true);
    assert.equal(resolveIsDryRun(["--dryrun"]), true);
    assert.equal(resolveIsDryRun(["-n"]), true);
    assert.equal(resolveIsDryRun(["--date", "2026-08-21", "--dry-run"]), true);
  });

  void it("parses --dry-run= flag with boolean values", () => {
    assert.equal(resolveIsDryRun(["--dry-run=true"]), true);
    assert.equal(resolveIsDryRun(["--dry-run=1"]), true);
    assert.equal(resolveIsDryRun(["--dry-run=yes"]), true);
    assert.equal(resolveIsDryRun(["--dry-run=false"]), false);
    assert.equal(resolveIsDryRun(["--dryrun=true"]), true);
  });

  void it("falls back to DRY_RUN env variable", () => {
    const originalDryRun = process.env.DRY_RUN;

    try {
      process.env.DRY_RUN = "true";
      assert.equal(resolveIsDryRun([]), true);

      process.env.DRY_RUN = "1";
      assert.equal(resolveIsDryRun([]), true);

      process.env.DRY_RUN = "yes";
      assert.equal(resolveIsDryRun([]), true);

      process.env.DRY_RUN = "false";
      assert.equal(resolveIsDryRun([]), false);

      process.env.DRY_RUN = "0";
      assert.equal(resolveIsDryRun([]), false);
    } finally {
      process.env.DRY_RUN = originalDryRun;
    }
  });

  void it("returns false when no flag or env var is provided", () => {
    const originalDryRun = process.env.DRY_RUN;

    try {
      delete process.env.DRY_RUN;
      assert.equal(resolveIsDryRun([]), false);
      assert.equal(resolveIsDryRun(["--date", "2026-08-21"]), false);
    } finally {
      process.env.DRY_RUN = originalDryRun;
    }
  });
});
