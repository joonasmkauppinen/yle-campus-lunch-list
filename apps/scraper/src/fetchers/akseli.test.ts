import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  AKSELI_DEFAULT_URL,
  AKSELI_RESTAURANT_ID,
  AKSELI_RESTAURANT_NAME,
  decodeHtmlEntities,
  extractAkseliHeadingDate,
  parseAkseliHtml,
  parseAkseliLine,
} from "./akseli.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_HTML_PATH = path.resolve(
  __dirname,
  "../../../../docs/akseli-sample-response-data.html",
);

const SAMPLE_HTML = fs.readFileSync(SAMPLE_HTML_PATH, "utf-8");

describe("akseli fetcher", () => {
  it("exports correct restaurant constants", () => {
    expect(AKSELI_RESTAURANT_ID).toBe("akseli");
    expect(AKSELI_RESTAURANT_NAME).toBe("Akseli");
    expect(AKSELI_DEFAULT_URL).toBe(
      "https://www.ninankeittio.fi/helsinki-ilmala-akseli/#lounaslista",
    );
  });

  it("decodeHtmlEntities unescapes HTML entities correctly", () => {
    expect(
      decodeHtmlEntities("Akseli &euro; &auml; &ouml; &ndash; &nbsp; &amp;"),
    ).toBe("Akseli € ä ö –   &");
  });

  it("extractAkseliHeadingDate extracts ISO dates correctly", () => {
    expect(extractAkseliHeadingDate("Maanantai 17.8.", "2026")).toBe(
      "2026-08-17",
    );
    expect(extractAkseliHeadingDate("Tiistai 18.8.", "2026")).toBe(
      "2026-08-18",
    );
    expect(extractAkseliHeadingDate("Torstai 20.8.2026", "2026")).toBe(
      "2026-08-20",
    );
    expect(extractAkseliHeadingDate("Perjantai 21.8.", "2026")).toBe(
      "2026-08-21",
    );
    expect(extractAkseliHeadingDate("Viikko 34")).toBeNull();
    expect(extractAkseliHeadingDate("Lounaslista")).toBeNull();
  });

  it("parseAkseliLine handles dishes, dietary flags, prices, and boilerplate", () => {
    // Boilerplate headers should return null
    expect(parseAkseliLine("Viikko 34", "2026-08-17")).toBeNull();
    expect(parseAkseliLine("Allergeenit", "2026-08-17")).toBeNull();
    expect(parseAkseliLine("M = maidoton", "2026-08-17")).toBeNull();
    expect(
      parseAkseliLine(
        "Käytämme suomalaista lihaa. Ilmoitamme kirjallisesti mikäli alkuperämaa on joku muu.",
        "2026-08-17",
      ),
    ).toBeNull();

    // Single dietary flag with price
    const item1 = parseAkseliLine(
      "Raikasta mojito-kananpoikaa ja lime-hunajajogurttia L,G 14,00€",
      "2026-08-17",
    );
    expect(item1).toEqual({
      date: "2026-08-17",
      item: "Raikasta mojito-kananpoikaa ja lime-hunajajogurttia",
      dietaryFlags: ["L", "G"],
    });

    // Multiple dietary flags and three letters (KM)
    const item2 = parseAkseliLine(
      "Haudutettua haimonnia ja katkarapuja sitruunaruohokastikkeessa M,G,KM 14,00€",
      "2026-08-17",
    );
    expect(item2).toEqual({
      date: "2026-08-17",
      item: "Haudutettua haimonnia ja katkarapuja sitruunaruohokastikkeessa",
      dietaryFlags: ["M", "G", "KM"],
    });

    // Porridge item
    const item3 = parseAkseliLine(
      "Puurobaari: Haudutettua ruispuuroa M,Veg",
      "2026-08-17",
    );
    expect(item3).toEqual({
      date: "2026-08-17",
      item: "Puurobaari: Haudutettua ruispuuroa",
      dietaryFlags: ["M", "Veg"],
    });

    // Parenthesized flag variation e.g. Talon pannukakkua L(Veg), marjahilloketta L,G,Veg ja kermavaahtoa L,G
    const item4 = parseAkseliLine(
      "Talon pannukakkua L(Veg), marjahilloketta L,G,Veg ja kermavaahtoa L,G",
      "2026-08-20",
    );
    expect(item4).toBeTruthy();
    expect(item4?.date).toBe("2026-08-20");
    expect(item4?.dietaryFlags).toContain("L");
    expect(item4?.dietaryFlags).toContain("G");
    expect(item4?.dietaryFlags).toContain("Veg");
  });

  it("parseAkseliHtml extracts all items for Monday 2026-08-17", () => {
    const items = parseAkseliHtml(SAMPLE_HTML, "2026-08-17");
    expect(items.length).toBe(7);
    expect(items[0]).toEqual({
      date: "2026-08-17",
      item: "Puurobaari: Haudutettua ruispuuroa",
      dietaryFlags: ["M", "Veg"],
    });
    expect(items[1]).toEqual({
      date: "2026-08-17",
      item: "Raikasta mojito-kananpoikaa ja lime-hunajajogurttia",
      dietaryFlags: ["L", "G"],
    });
    expect(items[5]).toEqual({
      date: "2026-08-17",
      item: "Creamy palsternakkakeittoa",
      dietaryFlags: ["L", "G", "KM"],
    });
  });

  it("parseAkseliHtml extracts all items for Tuesday 2026-08-18", () => {
    const items = parseAkseliHtml(SAMPLE_HTML, "2026-08-18");
    expect(items.length).toBe(8);
    const dishNames = items.map((i) => i.item);
    expect(dishNames).toContain("Puurobaari: Sadonkorjuupuuroa");
    expect(dishNames).toContain(
      "Paahdettua merilohta sitruunaisella ruohosipuli-hollandaisella",
    );
    expect(dishNames).toContain("Grillattua kesäkurpitsaa ja vuonankaalia");
    expect(dishNames).toContain("Marja-lemoncurdhyvettä");
  });

  it("parseAkseliHtml extracts all items for Friday 2026-08-21", () => {
    const items = parseAkseliHtml(SAMPLE_HTML, "2026-08-21");
    expect(items.length).toBe(7);
    const dishNames = items.map((i) => i.item);
    expect(dishNames).toContain("Puurobaari: Haudutettua uuniohrapuuroa");
    expect(dishNames).toContain("Pulled beef Bao Buneja ja lisukkeita");
    expect(dishNames).toContain(
      "Sitrus-hunaja marinoitua kananpoikaa ja parmesan dippiä",
    );
    expect(dishNames).toContain(
      "Täyteläistä kantarellikeittoa rapeita krutonkeja",
    );
  });

  it("handles non-matching dates and malformed HTML gracefully", () => {
    expect(parseAkseliHtml(SAMPLE_HTML, "2026-08-30")).toEqual([]);
    expect(parseAkseliHtml("", "2026-08-17")).toEqual([]);
    expect(parseAkseliHtml("<div>Not a menu</div>", "2026-08-17")).toEqual([]);
  });
});
