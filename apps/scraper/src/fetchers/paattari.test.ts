import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

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

void describe("paattari fetcher", () => {
  void it("exports correct restaurant constants", () => {
    assert.equal(PAATTARI_RESTAURANT_ID, "paattari");
    assert.equal(PAATTARI_RESTAURANT_NAME, "Päättäri");
    assert.equal(
      PAATTARI_DEFAULT_URL,
      "https://nordrest.fi/restaurang/ravintola-paattari/#ruokalista",
    );
  });

  void it("decodeHtmlEntities unescapes HTML entities correctly", () => {
    assert.equal(
      decodeHtmlEntities("Päättäri &euro; &auml; &ouml; &ndash; &nbsp; &amp;"),
      "Päättäri € ä ö –   &",
    );
  });

  void it("extractPaattariHeadingDate extracts ISO dates correctly", () => {
    assert.equal(
      extractPaattariHeadingDate("Maanantai 17.8.2026", "2026"),
      "2026-08-17",
    );
    assert.equal(
      extractPaattariHeadingDate("Tiistai 18.8.", "2026"),
      "2026-08-18",
    );
    assert.equal(
      extractPaattariHeadingDate("Keskiviikko 19.8.2026", "2026"),
      "2026-08-19",
    );
    assert.equal(
      extractPaattariHeadingDate("Torstai 20.8.2026", "2026"),
      "2026-08-20",
    );
    assert.equal(
      extractPaattariHeadingDate("Perjantai 21.8.2026", "2026"),
      "2026-08-21",
    );
    assert.equal(extractPaattariHeadingDate("Viikko 34"), null);
    assert.equal(extractPaattariHeadingDate("Lounaslista"), null);
  });

  void it("parsePaattariLine handles dishes, dietary flags, prices, and boilerplate", () => {
    // Boilerplate headers should return null
    assert.equal(parsePaattariLine("Viikko 34", "2026-08-17"), null);
    assert.equal(
      parsePaattariLine(
        "Huomioimme myös muut erikoisruokavaliot pyydettäessä.",
        "2026-08-17",
      ),
      null,
    );
    assert.equal(
      parsePaattariLine(
        "Lisätietoja ruoan allergeeneistä saat henkilökunnalta.",
        "2026-08-17",
      ),
      null,
    );
    assert.equal(
      parsePaattariLine("Lounaan hinta vuonna 2026 on 14,00 €.", "2026-08-17"),
      null,
    );

    // Single dietary flag with subtitle
    const item1 = parsePaattariLine(
      "Kermainen pippurikana & yrttiöljyä (L,G)",
      "2026-08-17",
    );
    assert.deepEqual(item1, {
      date: "2026-08-17",
      item: "Kermainen pippurikana & yrttiöljyä",
      dietaryFlags: ["L", "G"],
    });

    // Multiple dietary flags and description
    const item2 = parsePaattariLine(
      "Vöneriä, fetaa ja granaattiomenansiemeniä Paistettuä vöneriä tomaattikastikkeessa (L)",
      "2026-08-17",
    );
    assert.deepEqual(item2, {
      date: "2026-08-17",
      item: "Vöneriä, fetaa ja granaattiomenansiemeniä Paistettuä vöneriä tomaattikastikkeessa",
      dietaryFlags: ["L"],
    });

    // Slashes normalized
    const item3 = parsePaattariLine(
      "Riisiä/ paahdettuja kasviksia/ perunamuusia",
      "2026-08-17",
    );
    assert.deepEqual(item3, {
      date: "2026-08-17",
      item: "Riisiä / paahdettuja kasviksia / perunamuusia",
      dietaryFlags: [],
    });

    // Pizza Friday item
    const item4 = parsePaattariLine(
      "PIZZAPERJANTAI! Päättärin omalla pizzapohjareseptillä leivottua",
      "2026-08-21",
    );
    assert.deepEqual(item4, {
      date: "2026-08-21",
      item: "PIZZAPERJANTAI! Päättärin omalla pizzapohjareseptillä leivottua",
      dietaryFlags: [],
    });
  });

  void it("parsePaattariHtml extracts all items for Monday 2026-08-17", () => {
    const items = parsePaattariHtml(SAMPLE_HTML, "2026-08-17");
    assert.equal(items.length, 5);
    assert.deepEqual(items[0], {
      date: "2026-08-17",
      item: "Kermainen pippurikana & yrttiöljyä",
      dietaryFlags: ["L", "G"],
    });
    assert.deepEqual(items[1], {
      date: "2026-08-17",
      item: "Päivän kalaa & sienikastiketta",
      dietaryFlags: ["L", "G"],
    });
    assert.deepEqual(items[4], {
      date: "2026-08-17",
      item: "Pehmis & lisukkeet",
      dietaryFlags: ["L", "G"],
    });
  });

  void it("parsePaattariHtml extracts all items for Tuesday 2026-08-18", () => {
    const items = parsePaattariHtml(SAMPLE_HTML, "2026-08-18");
    assert.equal(items.length, 5);
    const dishNames = items.map((i) => i.item);
    assert.ok(
      dishNames.includes(
        "Paahdettua lohta & sandefjordin kastiketta Paahdettua lohta & sitruunalla ja yrteillä maustettua kermakastiketta",
      ),
    );
    assert.ok(dishNames.includes("Pasta bolognese & parmesania"));
    assert.ok(dishNames.includes("Seesami marinoitua tofua & chilimajoneesia"));
    assert.ok(dishNames.includes("Perunapaistosta / riisiä ja yrttiöljyä"));
    assert.ok(dishNames.includes("Pehmis & lisukkeet"));
  });

  void it("parsePaattariHtml extracts all items for Friday 2026-08-21", () => {
    const items = parsePaattariHtml(SAMPLE_HTML, "2026-08-21");
    assert.equal(items.length, 5);
    const dishNames = items.map((i) => i.item);
    assert.ok(
      dishNames.includes(
        "PIZZAPERJANTAI! Päättärin omalla pizzapohjareseptillä leivottua",
      ),
    );
    assert.ok(dishNames.includes("Kermainen sienipasta & parmesania"));
    assert.ok(dishNames.includes("Rapeaa kanaa & ranchkastiketta"));
    assert.ok(dishNames.includes("Paahdettuja yrttiperunoita"));
    assert.ok(dishNames.includes("Pehmis & lisukkeet"));
  });

  void it("handles non-matching dates and malformed HTML gracefully", () => {
    assert.deepEqual(parsePaattariHtml(SAMPLE_HTML, "2026-08-30"), []);
    assert.deepEqual(parsePaattariHtml("", "2026-08-17"), []);
    assert.deepEqual(
      parsePaattariHtml("<div>Not a menu</div>", "2026-08-17"),
      [],
    );
  });
});
