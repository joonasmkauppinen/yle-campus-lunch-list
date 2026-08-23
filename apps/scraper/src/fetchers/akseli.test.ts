import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

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

void describe("akseli fetcher", () => {
  void it("exports correct restaurant constants", () => {
    assert.equal(AKSELI_RESTAURANT_ID, "akseli");
    assert.equal(AKSELI_RESTAURANT_NAME, "Akseli");
    assert.equal(
      AKSELI_DEFAULT_URL,
      "https://www.ninankeittio.fi/helsinki-ilmala-akseli/#lounaslista",
    );
  });

  void it("decodeHtmlEntities unescapes HTML entities correctly", () => {
    assert.equal(
      decodeHtmlEntities("Akseli &euro; &auml; &ouml; &ndash; &nbsp; &amp;"),
      "Akseli € ä ö –   &",
    );
  });

  void it("extractAkseliHeadingDate extracts ISO dates correctly", () => {
    assert.equal(
      extractAkseliHeadingDate("Maanantai 17.8.", "2026"),
      "2026-08-17",
    );
    assert.equal(
      extractAkseliHeadingDate("Tiistai 18.8.", "2026"),
      "2026-08-18",
    );
    assert.equal(
      extractAkseliHeadingDate("Torstai 20.8.2026", "2026"),
      "2026-08-20",
    );
    assert.equal(
      extractAkseliHeadingDate("Perjantai 21.8.", "2026"),
      "2026-08-21",
    );
    assert.equal(extractAkseliHeadingDate("Viikko 34"), null);
    assert.equal(extractAkseliHeadingDate("Lounaslista"), null);
  });

  void it("parseAkseliLine handles dishes, dietary flags, prices, and boilerplate", () => {
    // Boilerplate headers should return null
    assert.equal(parseAkseliLine("Viikko 34", "2026-08-17"), null);
    assert.equal(parseAkseliLine("Allergeenit", "2026-08-17"), null);
    assert.equal(parseAkseliLine("M = maidoton", "2026-08-17"), null);
    assert.equal(
      parseAkseliLine(
        "Käytämme suomalaista lihaa. Ilmoitamme kirjallisesti mikäli alkuperämaa on joku muu.",
        "2026-08-17",
      ),
      null,
    );

    // Single dietary flag with price
    const item1 = parseAkseliLine(
      "Raikasta mojito-kananpoikaa ja lime-hunajajogurttia L,G 14,00€",
      "2026-08-17",
    );
    assert.deepEqual(item1, {
      date: "2026-08-17",
      item: "Raikasta mojito-kananpoikaa ja lime-hunajajogurttia",
      dietaryFlags: ["L", "G"],
    });

    // Multiple dietary flags and three letters (KM)
    const item2 = parseAkseliLine(
      "Haudutettua haimonnia ja katkarapuja sitruunaruohokastikkeessa M,G,KM 14,00€",
      "2026-08-17",
    );
    assert.deepEqual(item2, {
      date: "2026-08-17",
      item: "Haudutettua haimonnia ja katkarapuja sitruunaruohokastikkeessa",
      dietaryFlags: ["M", "G", "KM"],
    });

    // Porridge item
    const item3 = parseAkseliLine(
      "Puurobaari: Haudutettua ruispuuroa M,Veg",
      "2026-08-17",
    );
    assert.deepEqual(item3, {
      date: "2026-08-17",
      item: "Puurobaari: Haudutettua ruispuuroa",
      dietaryFlags: ["M", "Veg"],
    });

    // Parenthesized flag variation e.g. Talon pannukakkua L(Veg), marjahilloketta L,G,Veg ja kermavaahtoa L,G
    const item4 = parseAkseliLine(
      "Talon pannukakkua L(Veg), marjahilloketta L,G,Veg ja kermavaahtoa L,G",
      "2026-08-20",
    );
    assert.ok(item4);
    assert.equal(item4.date, "2026-08-20");
    assert.ok(item4.dietaryFlags.includes("L"));
    assert.ok(item4.dietaryFlags.includes("G"));
    assert.ok(item4.dietaryFlags.includes("Veg"));
  });

  void it("parseAkseliHtml extracts all items for Monday 2026-08-17", () => {
    const items = parseAkseliHtml(SAMPLE_HTML, "2026-08-17");
    assert.equal(items.length, 7);
    assert.deepEqual(items[0], {
      date: "2026-08-17",
      item: "Puurobaari: Haudutettua ruispuuroa",
      dietaryFlags: ["M", "Veg"],
    });
    assert.deepEqual(items[1], {
      date: "2026-08-17",
      item: "Raikasta mojito-kananpoikaa ja lime-hunajajogurttia",
      dietaryFlags: ["L", "G"],
    });
    assert.deepEqual(items[5], {
      date: "2026-08-17",
      item: "Creamy palsternakkakeittoa",
      dietaryFlags: ["L", "G", "KM"],
    });
  });

  void it("parseAkseliHtml extracts all items for Tuesday 2026-08-18", () => {
    const items = parseAkseliHtml(SAMPLE_HTML, "2026-08-18");
    assert.equal(items.length, 8);
    const dishNames = items.map((i) => i.item);
    assert.ok(dishNames.includes("Puurobaari: Sadonkorjuupuuroa"));
    assert.ok(
      dishNames.includes(
        "Paahdettua merilohta sitruunaisella ruohosipuli-hollandaisella",
      ),
    );
    assert.ok(dishNames.includes("Grillattua kesäkurpitsaa ja vuonankaalia"));
    assert.ok(dishNames.includes("Marja-lemoncurdhyvettä"));
  });

  void it("parseAkseliHtml extracts all items for Friday 2026-08-21", () => {
    const items = parseAkseliHtml(SAMPLE_HTML, "2026-08-21");
    assert.equal(items.length, 7);
    const dishNames = items.map((i) => i.item);
    assert.ok(dishNames.includes("Puurobaari: Haudutettua uuniohrapuuroa"));
    assert.ok(dishNames.includes("Pulled beef Bao Buneja ja lisukkeita"));
    assert.ok(
      dishNames.includes(
        "Sitrus-hunaja marinoitua kananpoikaa ja parmesan dippiä",
      ),
    );
    assert.ok(
      dishNames.includes("Täyteläistä kantarellikeittoa rapeita krutonkeja"),
    );
  });

  void it("handles non-matching dates and malformed HTML gracefully", () => {
    assert.deepEqual(parseAkseliHtml(SAMPLE_HTML, "2026-08-30"), []);
    assert.deepEqual(parseAkseliHtml("", "2026-08-17"), []);
    assert.deepEqual(
      parseAkseliHtml("<div>Not a menu</div>", "2026-08-17"),
      [],
    );
  });
});
