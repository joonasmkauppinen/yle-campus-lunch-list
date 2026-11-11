import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseFenniaHtml } from "./fennia.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SAMPLE_HTML = fs.readFileSync(
  path.resolve(__dirname, "../../../../docs/fennia-sample-response-data.html"),
  "utf-8",
);

describe("fennia fetcher", () => {
  it("parses the Finnish menu for the target date with flags from badges", () => {
    const items = parseFenniaHtml(SAMPLE_HTML, "2026-11-09");

    expect(items).toContainEqual({
      date: "2026-11-09",
      item: "Igorin kananpoikaa",
      dietaryFlags: ["G", "KM", "L"],
    });
    expect(items).toContainEqual({
      date: "2026-11-09",
      item: "Miso-palsternakkasosekeittoa",
      dietaryFlags: ["G", "M", "Veg"],
    });
  });

  it("leaves out the English copy, flag hover labels and the porridge bar", () => {
    const items = parseFenniaHtml(SAMPLE_HTML, "2026-11-09");
    const names = items.map((i) => i.item);

    expect(names).not.toContain("Kaurapuuroa");
    expect(names).not.toContain("Creamy mushroom risotto");
    expect(names.some((n) => /Gluteeniton|Laktoositon/.test(n))).toBe(false);
  });

  it("keeps one copy of a repeated staff note at the top of the day", () => {
    const items = parseFenniaHtml(SAMPLE_HTML, "2026-11-11");
    const notices = items.filter((i) => /klo/i.test(i.item));

    expect(notices).toEqual([
      {
        date: "2026-11-11",
        item: "LOUNASTA KLO.10.30-12.00",
        dietaryFlags: [],
      },
    ]);
    expect(items[0]).toEqual(notices[0]);
  });

  it("returns an empty list for a date not on the page", () => {
    expect(parseFenniaHtml(SAMPLE_HTML, "2026-11-14")).toEqual([]);
    expect(parseFenniaHtml("", "2026-11-09")).toEqual([]);
  });
});
