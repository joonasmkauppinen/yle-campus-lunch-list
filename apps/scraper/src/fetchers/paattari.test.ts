import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  decodeHtmlEntities,
  extractPaattariHeadingDate,
  PAATTARI_DEFAULT_URL,
  PAATTARI_RESTAURANT_ID,
  PAATTARI_RESTAURANT_NAME,
  parsePaattariHtml,
  parsePaattariLine,
} from "./paattari.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_HTML_PATH = path.resolve(
  __dirname,
  "../../../../docs/paattari-sample-response-data.html",
);

const SAMPLE_HTML = fs.readFileSync(SAMPLE_HTML_PATH, "utf-8");

describe("paattari fetcher", () => {
  it("exports correct restaurant constants", () => {
    expect(PAATTARI_RESTAURANT_ID).toBe("paattari");
    expect(PAATTARI_RESTAURANT_NAME).toBe("Päättäri");
    expect(PAATTARI_DEFAULT_URL).toBe(
      "https://nordrest.fi/restaurang/ravintola-paattari/#ruokalista",
    );
  });

  it("decodeHtmlEntities unescapes HTML entities correctly", () => {
    expect(
      decodeHtmlEntities("Päättäri &euro; &auml; &ouml; &ndash; &nbsp; &amp;"),
    ).toBe("Päättäri € ä ö –   &");
  });

  it("extractPaattariHeadingDate extracts ISO dates correctly", () => {
    expect(extractPaattariHeadingDate("Maanantai 17.8.2026", "2026")).toBe(
      "2026-08-17",
    );
    expect(extractPaattariHeadingDate("Tiistai 18.8.", "2026")).toBe(
      "2026-08-18",
    );
    expect(extractPaattariHeadingDate("Keskiviikko 19.8.2026", "2026")).toBe(
      "2026-08-19",
    );
    expect(extractPaattariHeadingDate("Torstai 20.8.2026", "2026")).toBe(
      "2026-08-20",
    );
    expect(extractPaattariHeadingDate("Perjantai 21.8.2026", "2026")).toBe(
      "2026-08-21",
    );
    expect(extractPaattariHeadingDate("Viikko 34")).toBeNull();
    expect(extractPaattariHeadingDate("Lounaslista")).toBeNull();
  });

  it("parsePaattariLine handles dishes, dietary flags, prices, and boilerplate", () => {
    // Boilerplate headers should return null
    expect(parsePaattariLine("Viikko 34", "2026-08-17")).toBeNull();
    expect(
      parsePaattariLine(
        "Huomioimme myös muut erikoisruokavaliot pyydettäessä.",
        "2026-08-17",
      ),
    ).toBeNull();
    expect(
      parsePaattariLine(
        "Lisätietoja ruoan allergeeneistä saat henkilökunnalta.",
        "2026-08-17",
      ),
    ).toBeNull();
    expect(
      parsePaattariLine("Lounaan hinta vuonna 2026 on 14,00 €.", "2026-08-17"),
    ).toBeNull();

    // Single dietary flag with subtitle
    const item1 = parsePaattariLine(
      "Kermainen pippurikana & yrttiöljyä (L,G)",
      "2026-08-17",
    );
    expect(item1).toEqual({
      date: "2026-08-17",
      item: "Kermainen pippurikana & yrttiöljyä",
      dietaryFlags: ["L", "G"],
    });

    // Multiple dietary flags and description
    const item2 = parsePaattariLine(
      "Vöneriä, fetaa ja granaattiomenansiemeniä Paistettuä vöneriä tomaattikastikkeessa (L)",
      "2026-08-17",
    );
    expect(item2).toEqual({
      date: "2026-08-17",
      item: "Vöneriä, fetaa ja granaattiomenansiemeniä Paistettuä vöneriä tomaattikastikkeessa",
      dietaryFlags: ["L"],
    });

    // Slashes normalized
    const item3 = parsePaattariLine(
      "Riisiä/ paahdettuja kasviksia/ perunamuusia",
      "2026-08-17",
    );
    expect(item3).toEqual({
      date: "2026-08-17",
      item: "Riisiä / paahdettuja kasviksia / perunamuusia",
      dietaryFlags: [],
    });

    // Pizza Friday item
    const item4 = parsePaattariLine(
      "PIZZAPERJANTAI! Päättärin omalla pizzapohjareseptillä leivottua",
      "2026-08-21",
    );
    expect(item4).toEqual({
      date: "2026-08-21",
      item: "PIZZAPERJANTAI! Päättärin omalla pizzapohjareseptillä leivottua",
      dietaryFlags: [],
    });
  });

  it("parsePaattariHtml extracts all items for Monday 2026-08-17", () => {
    const items = parsePaattariHtml(SAMPLE_HTML, "2026-08-17");
    expect(items.length).toBe(5);
    expect(items[0]).toEqual({
      date: "2026-08-17",
      item: "Kermainen pippurikana & yrttiöljyä",
      dietaryFlags: ["L", "G"],
    });
    expect(items[1]).toEqual({
      date: "2026-08-17",
      item: "Päivän kalaa & sienikastiketta",
      dietaryFlags: ["L", "G"],
    });
    expect(items[4]).toEqual({
      date: "2026-08-17",
      item: "Pehmis & lisukkeet",
      dietaryFlags: ["L", "G"],
    });
  });

  it("parsePaattariHtml extracts all items for Tuesday 2026-08-18", () => {
    const items = parsePaattariHtml(SAMPLE_HTML, "2026-08-18");
    expect(items.length).toBe(5);
    const dishNames = items.map((i) => i.item);
    expect(dishNames).toContain(
      "Paahdettua lohta & sandefjordin kastiketta Paahdettua lohta & sitruunalla ja yrteillä maustettua kermakastiketta",
    );
    expect(dishNames).toContain("Pasta bolognese & parmesania");
    expect(dishNames).toContain("Seesami marinoitua tofua & chilimajoneesia");
    expect(dishNames).toContain("Perunapaistosta / riisiä ja yrttiöljyä");
    expect(dishNames).toContain("Pehmis & lisukkeet");
  });

  it("parsePaattariHtml extracts all items for Friday 2026-08-21", () => {
    const items = parsePaattariHtml(SAMPLE_HTML, "2026-08-21");
    expect(items.length).toBe(5);
    const dishNames = items.map((i) => i.item);
    expect(dishNames).toContain(
      "PIZZAPERJANTAI! Päättärin omalla pizzapohjareseptillä leivottua",
    );
    expect(dishNames).toContain("Kermainen sienipasta & parmesania");
    expect(dishNames).toContain("Rapeaa kanaa & ranchkastiketta");
    expect(dishNames).toContain("Paahdettuja yrttiperunoita");
    expect(dishNames).toContain("Pehmis & lisukkeet");
  });

  it("handles non-matching dates and malformed HTML gracefully", () => {
    expect(parsePaattariHtml(SAMPLE_HTML, "2026-08-30")).toEqual([]);
    expect(parsePaattariHtml("", "2026-08-17")).toEqual([]);
    expect(parsePaattariHtml("<div>Not a menu</div>", "2026-08-17")).toEqual(
      [],
    );
  });
});
