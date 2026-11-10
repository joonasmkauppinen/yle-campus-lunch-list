import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  extractPianoHeadingDate,
  parsePianoHtml,
  parsePianoLine,
} from "./piano.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SAMPLE_HTML = fs.readFileSync(
  path.resolve(__dirname, "../../../../docs/piano-sample-response-data.html"),
  "utf-8",
);

describe("piano fetcher", () => {
  it("parses the dishes listed under the target date's heading", () => {
    const items = parsePianoHtml(SAMPLE_HTML, "2026-11-10");

    expect(items).toHaveLength(5);
    expect(items[1]).toEqual({
      date: "2026-11-10",
      item: "Talon lohimurekepihvit, tartarkastiketta ja muusia",
      dietaryFlags: ["L", "SG"],
    });
  });

  it("handles headings wrapped in bold or ending in a non-breaking space", () => {
    expect(parsePianoHtml(SAMPLE_HTML, "2026-11-11")).toHaveLength(5);
    expect(parsePianoHtml(SAMPLE_HTML, "2026-11-13")[0]?.item).toBe(
      "Kukkakaalikeittoa",
    );
  });

  it("returns an empty list for a date not on the page", () => {
    expect(parsePianoHtml(SAMPLE_HTML, "2026-11-14")).toEqual([]);
  });

  it("splits dot-joined flags and keeps names without flags intact", () => {
    expect(parsePianoLine("Pinaattilettuja, puolukkahilloa L ", "d")).toEqual({
      date: "d",
      item: "Pinaattilettuja, puolukkahilloa",
      dietaryFlags: ["L"],
    });
    expect(
      parsePianoLine("Wieninleike; anjovista M.SG", "d")?.dietaryFlags,
    ).toEqual(["M", "SG"]);
    expect(parsePianoLine("Ylikypsää BBQ possua", "d")).toEqual({
      date: "d",
      item: "Ylikypsää BBQ possua",
      dietaryFlags: [],
    });
  });

  it("resolves the year of a heading across the new year", () => {
    expect(extractPianoHeadingDate("Maanantai 9.11", "2026-11-09")).toBe(
      "2026-11-09",
    );
    expect(extractPianoHeadingDate("Torstai 31.12", "2027-01-01")).toBe(
      "2026-12-31",
    );
    expect(extractPianoHeadingDate("Perjantai 1.1", "2026-12-31")).toBe(
      "2027-01-01",
    );
    expect(extractPianoHeadingDate("Lämpimästi tervetuloa", "2026-11-09")).toBe(
      null,
    );
  });
});
