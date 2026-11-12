import { readFileSync } from "node:fs";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getSources,
  getWeekDates,
  parseDays,
  weeklyUrl,
  createSourceFetcher,
} from "./weekly.js";
import { menuHash, reconcileDayRows } from "./weekly-sync.js";
import { resolveScrapeDates } from "./index.js";

const fixture = (name: string) =>
  readFileSync(new URL(`../../../docs/${name}`, import.meta.url), "utf8");
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("weekly sources", () => {
  it("upgrades daily feed overrides", () => {
    expect(
      weeklyUrl("https://lounastaja.app/api/rss?days=current&language=fi"),
    ).toBe("https://lounastaja.app/api/rss?language=fi");
    expect(
      weeklyUrl(
        "https://www.compass-group.fi/menuapi/feed/rss/current-day?costNumber=3642",
      ),
    ).toContain("current-week?costNumber=3642");
  });
  it("extracts the week from every restaurant fixture without mixing dates", () => {
    const fixtures: Record<string, string> = {
      huoltamo: "huoltamo-api-sample-response-data.json",
      piccolo: "huoltamo-api-sample-response-data.json",
      "studio-10": "huoltamo-api-sample-response-data.json",
      "iso-paja": "iso-paja-sample-response-data.html",
      akseli: "akseli-sample-response-data.html",
      paattari: "paattari-sample-response-data.html",
      fennia: "fennia-sample-response-data.html",
      piano: "piano-sample-response-data.html",
      "dylan-luft": "dylan-luft-rss-sample-data.xml",
      "dylan-bole": "dylan-bole-rss-sample-data.xml",
      "dylan-la-ilma": "dylan-la-ilma-rss-sample-data.xml",
      "pasilan-linkki": "linkki-rss-sample-data.xml",
    };
    for (const source of getSources()) {
      const dates = getWeekDates(
        ["piano", "fennia"].includes(source.id)
          ? "2026-11-11"
          : source.id === "dylan-la-ilma"
            ? "2026-08-31"
            : source.id === "iso-paja"
              ? "2026-08-24"
              : "2026-08-21",
      );
      const days = parseDays(
        source,
        fixture(fixtures[source.id] ?? "missing-fixture"),
        dates,
      );
      expect(days).toHaveLength(7);
      expect(
        days.some((day) => day.items.length > 0),
        source.id,
      ).toBe(true);
      for (const day of days)
        expect(day.items.every((item) => item.date === day.date)).toBe(true);
    }
  });
  it("does not copy undated RSS content to arbitrary days", () => {
    for (const source of getSources().filter(
      (source) =>
        source.id.startsWith("dylan") || source.id === "pasilan-linkki",
    )) {
      const days = parseDays(
        source,
        "<rss><channel><item><title>Lunch</title><description>Soup</description></item></channel></rss>",
        getWeekDates("2026-11-12"),
      );
      expect(days.every((day) => day.state === "unpublished")).toBe(true);
    }
  });
  it("fetches the shared Intra payload only once and isolates failures", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(fixture("huoltamo-api-sample-response-data.json")),
      );
    vi.stubGlobal("fetch", fetch);
    const fetchSource = createSourceFetcher();
    const sources = getSources().filter((source) =>
      ["huoltamo", "piccolo", "studio-10"].includes(source.id),
    );
    for (const source of sources)
      await fetchSource(source, getWeekDates("2026-08-21"));
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 503 })),
    );
    const first = sources[0];
    if (!first) throw new Error("Missing source");
    expect((await createSourceFetcher()(first, ["2026-08-21"]))[0]?.state).toBe(
      "failed",
    );
  });
});

describe("week reconciliation and tagging identity", () => {
  it("replaces one published day, preserves unknown/failed dates, and removes known closures", () => {
    const rows = [
      ["id", "name", "2026-11-14", "old"],
      ["id", "name", "2026-11-15", "Sunday"],
    ];
    const day = { date: "2026-11-14", state: "published" as const, items: [] };
    const fresh = [["id", "name", day.date, "new"]];
    expect(reconcileDayRows(rows, fresh, day)).toEqual([rows[1], ...fresh]);
    expect(reconcileDayRows(rows, [], { ...day, state: "failed" })).toEqual(
      rows,
    );
    expect(
      reconcileDayRows(rows, [], { ...day, state: "unpublished" }),
    ).toEqual(rows);
    expect(reconcileDayRows(rows, [], { ...day, state: "closed" })).toEqual([
      rows[1],
    ]);
  });
  it("invalidates the whole menu when context or flags change", () => {
    const main = { date: "2026-11-12", item: "Main", dietaryFlags: [] };
    const side = { ...main, item: "Side" };
    expect(menuHash([main, side])).not.toBe(menuHash([side, main]));
    expect(menuHash([main])).not.toBe(
      menuHash([{ ...main, dietaryFlags: ["L"] }]),
    );
  });
});

describe("scrape CLI scope", () => {
  it("defaults to a seven-day week, supports explicit day and week anchors", () => {
    vi.stubEnv("TARGET_DATE", "");
    vi.stubEnv("DATE", "");
    vi.stubEnv("SCRAPE_DATE", "");
    expect(resolveScrapeDates([]).dates).toHaveLength(7);
    expect(resolveScrapeDates(["--date", "2026-11-14"]).dates).toEqual([
      "2026-11-14",
    ]);
    expect(resolveScrapeDates(["--week", "2026-11-14"]).dates).toHaveLength(7);
    expect(() => resolveScrapeDates(["--week"])).toThrow();
    expect(() => resolveScrapeDates(["--date", "2026-02-30"])).toThrow();
    expect(() =>
      resolveScrapeDates(["--week", "2026-11-14", "--date", "2026-11-12"]),
    ).toThrow();
  });
});
