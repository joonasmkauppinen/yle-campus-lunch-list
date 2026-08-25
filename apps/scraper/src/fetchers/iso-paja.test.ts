import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  decodeHtmlEntities,
  extractIsoPajaHeadingDate,
  ISO_PAJA_DEFAULT_URL,
  ISO_PAJA_RESTAURANT_ID,
  ISO_PAJA_RESTAURANT_NAME,
  parseIsoPajaHtml,
  parseIsoPajaLine,
} from "./iso-paja.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_HTML_PATH = path.resolve(
  __dirname,
  "../../../../docs/iso-paja-sample-response-data.html",
);

const SAMPLE_HTML = fs.readFileSync(SAMPLE_HTML_PATH, "utf-8");

void describe("iso-paja fetcher", () => {
  void it("exports correct restaurant constants", () => {
    assert.equal(ISO_PAJA_RESTAURANT_ID, "iso-paja");
    assert.equal(ISO_PAJA_RESTAURANT_NAME, "Iso Paja");
    assert.equal(ISO_PAJA_DEFAULT_URL, "https://www.hhravintolat.fi/iso-paja/");
  });

  void it("decodeHtmlEntities unescapes HTML entities correctly", () => {
    assert.equal(
      decodeHtmlEntities("Lounas &euro; &auml; &ouml; &ndash; &nbsp; &amp;"),
      "Lounas € ä ö –   &",
    );
  });

  void it("extractIsoPajaHeadingDate extracts ISO date correctly", () => {
    assert.equal(
      extractIsoPajaHeadingDate("MAANANTAI 24.8.", "2026"),
      "2026-08-24",
    );
    assert.equal(
      extractIsoPajaHeadingDate("TIISTAI 25.8.", "2026"),
      "2026-08-25",
    );
    assert.equal(
      extractIsoPajaHeadingDate("PERJANTAI 28.8.2026", "2026"),
      "2026-08-28",
    );
    assert.equal(extractIsoPajaHeadingDate("Ravintola Iso Paja"), null);
  });

  void it("parseIsoPajaLine handles dishes, dietary flags, subtitles, and boilerplate", () => {
    // Category subtitles should return menu items with empty dietary flags and uppercase text
    assert.deepEqual(parseIsoPajaLine("Buffet Menu", "2026-08-24"), {
      date: "2026-08-24",
      item: "BUFFET MENU",
      dietaryFlags: [],
    });
    assert.deepEqual(parseIsoPajaLine("Vege Menu", "2026-08-24"), {
      date: "2026-08-24",
      item: "VEGE MENU",
      dietaryFlags: [],
    });
    assert.deepEqual(parseIsoPajaLine("Kasvis Menu", "2026-08-24"), {
      date: "2026-08-24",
      item: "VEGE MENU",
      dietaryFlags: [],
    });
    assert.deepEqual(parseIsoPajaLine("Street Kitchen", "2026-08-24"), {
      date: "2026-08-24",
      item: "STREET KITCHEN",
      dietaryFlags: [],
    });
    assert.deepEqual(parseIsoPajaLine("Aamupuuro", "2026-08-24"), {
      date: "2026-08-24",
      item: "AAMUPUURO",
      dietaryFlags: [],
    });

    // Actual boilerplate should return null
    assert.equal(parseIsoPajaLine("Lounas buffet", "2026-08-24"), null);
    assert.equal(parseIsoPajaLine("Lounas", "2026-08-24"), null);
    assert.equal(parseIsoPajaLine("Salaatti-deli", "2026-08-24"), null);
    assert.equal(parseIsoPajaLine("Hävikkimyynti", "2026-08-24"), null);
    assert.equal(parseIsoPajaLine("&nbsp;", "2026-08-24"), null);

    // Parenthesized dietary flags with extra note
    const item1 = parseIsoPajaLine(
      "Pekoninen jauhelihapihvi (L) – gluteeniton saatavilla",
      "2026-08-24",
    );
    assert.deepEqual(item1, {
      date: "2026-08-24",
      item: "Pekoninen jauhelihapihvi – gluteeniton saatavilla",
      dietaryFlags: ["L"],
    });

    // Multiple dietary flags
    const item2 = parseIsoPajaLine(
      "Kanttarellikastiketta (L, G)",
      "2026-08-24",
    );
    assert.deepEqual(item2, {
      date: "2026-08-24",
      item: "Kanttarellikastiketta",
      dietaryFlags: ["L", "G"],
    });

    // Multi-dish on a single line
    const item3 = parseIsoPajaLine(
      "Samosanyyttejä (Ve) Basmatiriisiä (Ve, G)",
      "2026-08-25",
    );
    assert.deepEqual(item3, {
      date: "2026-08-25",
      item: "Samosanyyttejä Basmatiriisiä",
      dietaryFlags: ["Ve", "G"],
    });

    // Porridge line under Aamupuuro section
    const item4 = parseIsoPajaLine(
      "Kaurapuuro (Ve, G)",
      "2026-08-24",
      "Aamupuuro",
    );
    assert.deepEqual(item4, {
      date: "2026-08-24",
      item: "Kaurapuuro",
      dietaryFlags: ["Ve", "G"],
    });
  });

  void it("parseIsoPajaHtml extracts all items and uppercase subtitles for Monday 2026-08-24", () => {
    const items = parseIsoPajaHtml(SAMPLE_HTML, "2026-08-24");
    assert.equal(items.length, 13);
    assert.deepEqual(items[0], {
      date: "2026-08-24",
      item: "BUFFET MENU",
      dietaryFlags: [],
    });
    assert.deepEqual(items[1], {
      date: "2026-08-24",
      item: "Pekoninen jauhelihapihvi – gluteeniton saatavilla",
      dietaryFlags: ["L"],
    });
    assert.deepEqual(items[2], {
      date: "2026-08-24",
      item: "Kanttarellikastiketta",
      dietaryFlags: ["L", "G"],
    });
    assert.deepEqual(items[6], {
      date: "2026-08-24",
      item: "VEGE MENU",
      dietaryFlags: [],
    });
    assert.deepEqual(items[11], {
      date: "2026-08-24",
      item: "AAMUPUURO",
      dietaryFlags: [],
    });
    assert.deepEqual(items[12], {
      date: "2026-08-24",
      item: "Kaurapuuro",
      dietaryFlags: ["Ve", "G"],
    });
  });

  void it("parseIsoPajaHtml extracts all items including uppercase Street Kitchen for Tuesday 2026-08-25", () => {
    const items = parseIsoPajaHtml(SAMPLE_HTML, "2026-08-25");
    assert.ok(items.length >= 10);
    const dishNames = items.map((i) => i.item);
    assert.ok(dishNames.includes("BUFFET MENU"));
    assert.ok(dishNames.includes("Tandoorikanaa"));
    assert.ok(dishNames.includes("Paahdettua Naanleipää"));
    assert.ok(dishNames.includes("VEGE MENU"));
    assert.ok(dishNames.includes("STREET KITCHEN"));
    assert.ok(dishNames.includes("Italian burgeri"));
    assert.ok(dishNames.includes("Ranskalaiset"));
    assert.ok(dishNames.includes("AAMUPUURO"));
    assert.ok(dishNames.includes("Mannapuuro"));
  });

  void it("parseIsoPajaHtml extracts all items for Friday 2026-08-28", () => {
    const items = parseIsoPajaHtml(SAMPLE_HTML, "2026-08-28");
    assert.ok(items.length >= 10);
    const dishNames = items.map((i) => i.item);
    assert.ok(dishNames.includes("BUFFET MENU"));
    assert.ok(dishNames.includes("Chorizopyöryköitä"));
    assert.ok(dishNames.includes("Broilerin koipinuijat"));
    assert.ok(dishNames.includes("VEGE MENU"));
    assert.ok(dishNames.includes("Jäätelö"));
    assert.ok(dishNames.includes("AAMUPUURO"));
    assert.ok(dishNames.includes("Neljänviljanpuuro"));
  });

  void it("handles non-matching dates and malformed HTML gracefully", () => {
    assert.deepEqual(parseIsoPajaHtml(SAMPLE_HTML, "2026-08-30"), []);
    assert.deepEqual(parseIsoPajaHtml("", "2026-08-24"), []);
    assert.deepEqual(
      parseIsoPajaHtml("<div>Not a menu</div>", "2026-08-24"),
      [],
    );
  });
});
