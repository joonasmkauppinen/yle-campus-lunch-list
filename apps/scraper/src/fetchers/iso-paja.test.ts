import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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

describe("iso-paja fetcher", () => {
  it("exports correct restaurant constants", () => {
    expect(ISO_PAJA_RESTAURANT_ID).toBe("iso-paja");
    expect(ISO_PAJA_RESTAURANT_NAME).toBe("Iso Paja");
    expect(ISO_PAJA_DEFAULT_URL).toBe("https://www.hhravintolat.fi/iso-paja/");
  });

  it("decodeHtmlEntities unescapes HTML entities correctly", () => {
    expect(
      decodeHtmlEntities("Lounas &euro; &auml; &ouml; &ndash; &nbsp; &amp;"),
    ).toBe("Lounas € ä ö –   &");
  });

  it("extractIsoPajaHeadingDate extracts ISO date correctly", () => {
    expect(extractIsoPajaHeadingDate("MAANANTAI 24.8.", "2026")).toBe(
      "2026-08-24",
    );
    expect(extractIsoPajaHeadingDate("TIISTAI 25.8.", "2026")).toBe(
      "2026-08-25",
    );
    expect(extractIsoPajaHeadingDate("PERJANTAI 28.8.2026", "2026")).toBe(
      "2026-08-28",
    );
    expect(extractIsoPajaHeadingDate("Ravintola Iso Paja")).toBeNull();
  });

  it("parseIsoPajaLine handles dishes, dietary flags, subtitles, and boilerplate", () => {
    // Category subtitles should return menu items with empty dietary flags and uppercase text
    expect(parseIsoPajaLine("Buffet Menu", "2026-08-24")).toEqual({
      date: "2026-08-24",
      item: "BUFFET MENU",
      dietaryFlags: [],
    });
    expect(parseIsoPajaLine("Vege Menu", "2026-08-24")).toEqual({
      date: "2026-08-24",
      item: "VEGE MENU",
      dietaryFlags: [],
    });
    expect(parseIsoPajaLine("Kasvis Menu", "2026-08-24")).toEqual({
      date: "2026-08-24",
      item: "VEGE MENU",
      dietaryFlags: [],
    });
    expect(parseIsoPajaLine("Street Kitchen", "2026-08-24")).toEqual({
      date: "2026-08-24",
      item: "STREET KITCHEN",
      dietaryFlags: [],
    });
    expect(parseIsoPajaLine("Aamupuuro", "2026-08-24")).toEqual({
      date: "2026-08-24",
      item: "AAMUPUURO",
      dietaryFlags: [],
    });

    // Actual boilerplate should return null
    expect(parseIsoPajaLine("Lounas buffet", "2026-08-24")).toBeNull();
    expect(parseIsoPajaLine("Lounas", "2026-08-24")).toBeNull();
    expect(parseIsoPajaLine("Salaatti-deli", "2026-08-24")).toBeNull();
    expect(parseIsoPajaLine("Hävikkimyynti", "2026-08-24")).toBeNull();
    expect(parseIsoPajaLine("&nbsp;", "2026-08-24")).toBeNull();

    // Parenthesized dietary flags with extra note
    const item1 = parseIsoPajaLine(
      "Pekoninen jauhelihapihvi (L) – gluteeniton saatavilla",
      "2026-08-24",
    );
    expect(item1).toEqual({
      date: "2026-08-24",
      item: "Pekoninen jauhelihapihvi – gluteeniton saatavilla",
      dietaryFlags: ["L"],
    });

    // Multiple dietary flags
    const item2 = parseIsoPajaLine(
      "Kanttarellikastiketta (L, G)",
      "2026-08-24",
    );
    expect(item2).toEqual({
      date: "2026-08-24",
      item: "Kanttarellikastiketta",
      dietaryFlags: ["L", "G"],
    });

    // Multi-dish on a single line
    const item3 = parseIsoPajaLine(
      "Samosanyyttejä (Ve) Basmatiriisiä (Ve, G)",
      "2026-08-25",
    );
    expect(item3).toEqual({
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
    expect(item4).toEqual({
      date: "2026-08-24",
      item: "Kaurapuuro",
      dietaryFlags: ["Ve", "G"],
    });
  });

  it("parseIsoPajaHtml extracts all items and uppercase subtitles for Monday 2026-08-24", () => {
    const items = parseIsoPajaHtml(SAMPLE_HTML, "2026-08-24");
    expect(items.length).toBe(13);
    expect(items[0]).toEqual({
      date: "2026-08-24",
      item: "BUFFET MENU",
      dietaryFlags: [],
    });
    expect(items[1]).toEqual({
      date: "2026-08-24",
      item: "Pekoninen jauhelihapihvi – gluteeniton saatavilla",
      dietaryFlags: ["L"],
    });
    expect(items[2]).toEqual({
      date: "2026-08-24",
      item: "Kanttarellikastiketta",
      dietaryFlags: ["L", "G"],
    });
    expect(items[6]).toEqual({
      date: "2026-08-24",
      item: "VEGE MENU",
      dietaryFlags: [],
    });
    expect(items[11]).toEqual({
      date: "2026-08-24",
      item: "AAMUPUURO",
      dietaryFlags: [],
    });
    expect(items[12]).toEqual({
      date: "2026-08-24",
      item: "Kaurapuuro",
      dietaryFlags: ["Ve", "G"],
    });
  });

  it("parseIsoPajaHtml extracts all items including uppercase Street Kitchen for Tuesday 2026-08-25", () => {
    const items = parseIsoPajaHtml(SAMPLE_HTML, "2026-08-25");
    expect(items.length).toBeGreaterThanOrEqual(10);
    const dishNames = items.map((i) => i.item);
    expect(dishNames).toContain("BUFFET MENU");
    expect(dishNames).toContain("Tandoorikanaa");
    expect(dishNames).toContain("Paahdettua Naanleipää");
    expect(dishNames).toContain("VEGE MENU");
    expect(dishNames).toContain("STREET KITCHEN");
    expect(dishNames).toContain("Italian burgeri");
    expect(dishNames).toContain("Ranskalaiset");
    expect(dishNames).toContain("AAMUPUURO");
    expect(dishNames).toContain("Mannapuuro");
  });

  it("parseIsoPajaHtml extracts all items for Friday 2026-08-28", () => {
    const items = parseIsoPajaHtml(SAMPLE_HTML, "2026-08-28");
    expect(items.length).toBeGreaterThanOrEqual(10);
    const dishNames = items.map((i) => i.item);
    expect(dishNames).toContain("BUFFET MENU");
    expect(dishNames).toContain("Chorizopyöryköitä");
    expect(dishNames).toContain("Broilerin koipinuijat");
    expect(dishNames).toContain("VEGE MENU");
    expect(dishNames).toContain("Jäätelö");
    expect(dishNames).toContain("AAMUPUURO");
    expect(dishNames).toContain("Neljänviljanpuuro");
  });

  it("handles non-matching dates and malformed HTML gracefully", () => {
    expect(parseIsoPajaHtml(SAMPLE_HTML, "2026-08-30")).toEqual([]);
    expect(parseIsoPajaHtml("", "2026-08-24")).toEqual([]);
    expect(parseIsoPajaHtml("<div>Not a menu</div>", "2026-08-24")).toEqual([]);
  });
});
