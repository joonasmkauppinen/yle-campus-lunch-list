import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  getHelsinkiDateString,
  parseDietaryFlags,
  parseHuoltamoResponse,
  parseIntraAllRestaurants,
  parseIntraResponse,
} from "./intra.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestRawApiResponse {
  status?: number;
  items?: {
    id?: string;
    date?: string;
    restaurant?: string;
    restaurantId?: string;
    menu?: string;
  }[];
}

void describe("intra fetcher", () => {
  const samplePath = path.resolve(
    __dirname,
    "../../../../docs/huoltamo-api-sample-response-data.json",
  );
  const rawData = JSON.parse(
    fs.readFileSync(samplePath, "utf8"),
  ) as TestRawApiResponse;

  void it("getHelsinkiDateString formats UTC timestamps to Europe/Helsinki date", () => {
    // 2026-08-16T21:00:00.000Z is 2026-08-17 00:00:00 EEST (UTC+3)
    const formatted = getHelsinkiDateString("2026-08-16T21:00:00.000Z");
    assert.equal(formatted, "2026-08-17");

    const formatted2 = getHelsinkiDateString("2026-08-20T21:00:00.000Z");
    assert.equal(formatted2, "2026-08-21");
  });

  void it("parseDietaryFlags parses various diet formats correctly", () => {
    assert.deepEqual(parseDietaryFlags("G,Veg"), ["G", "Veg"]);
    assert.deepEqual(parseDietaryFlags("(L, G)"), ["L", "G"]);
    assert.deepEqual(parseDietaryFlags("(L)"), ["L"]);
    assert.deepEqual(parseDietaryFlags("(V, G)"), ["V", "G"]);
    assert.deepEqual(parseDietaryFlags("VL,G, Vegaaninen keittiöstä"), [
      "VL",
      "G",
      "Vegaaninen keittiöstä",
    ]);
    assert.deepEqual(parseDietaryFlags(""), []);
    assert.deepEqual(parseDietaryFlags(undefined), []);
  });

  void it("parseIntraResponse extracts correct items for Huoltamo on 2026-08-21", () => {
    const results = parseIntraResponse(rawData, "huoltamo", "2026-08-21");

    assert.equal(results.length, 9);
    const item0 = results[0];
    assert.ok(item0);
    assert.equal(item0.item, "Fish remoulade burger");
    assert.deepEqual(item0.dietaryFlags, ["L"]);
    assert.equal(item0.date, "2026-08-21");

    const item7 = results[7];
    assert.ok(item7);
    assert.equal(item7.item, "Jäätelöbaari 🍦🍬");
    assert.deepEqual(item7.dietaryFlags, []);

    const item8 = results[8];
    assert.ok(item8);
    assert.equal(item8.item, "Kahvi / tee");
  });

  void it("parseIntraResponse extracts correct items for Studio 10 on 2026-08-21", () => {
    const results = parseIntraResponse(rawData, "studio-10", "2026-08-21");

    assert.equal(results.length, 4);
    const item0 = results[0];
    assert.ok(item0);
    assert.equal(
      item0.item,
      "Pasta alla pancetta e panna - Kermaista pekonipastaa",
    );
    assert.deepEqual(item0.dietaryFlags, ["L"]);
    assert.equal(item0.date, "2026-08-21");

    const item1 = results[1];
    assert.ok(item1);
    assert.equal(item1.item, "Scorfano al pesto - Puna-ahventa & pestoa");
    assert.deepEqual(item1.dietaryFlags, ["L", "G"]);

    const item2 = results[2];
    assert.ok(item2);
    assert.equal(item2.item, "Tacchino Cordon Bleu - Kalkkuna Cordon Bleu");
    assert.deepEqual(item2.dietaryFlags, ["L"]);

    const item3 = results[3];
    assert.ok(item3);
    assert.equal(item3.item, "Zucchini al forno - Kesäkurpitsaa uunissa");
    assert.deepEqual(item3.dietaryFlags, ["V", "G"]);
  });

  void it("parseIntraResponse extracts correct items for Piccolo on 2026-08-21", () => {
    const results = parseIntraResponse(rawData, "piccolo", "2026-08-21");

    assert.equal(results.length, 4);
    const item0 = results[0];
    assert.ok(item0);
    assert.equal(item0.item, "Katkarapu-pastasalaattia");
    assert.deepEqual(item0.dietaryFlags, []);
    assert.equal(item0.date, "2026-08-21");

    const item1 = results[1];
    assert.ok(item1);
    assert.equal(item1.item, "Raejuustosalaattia");
    assert.deepEqual(item1.dietaryFlags, []);

    const item2 = results[2];
    assert.ok(item2);
    assert.equal(item2.item, "Punajuurisosekeittoa");
    assert.deepEqual(item2.dietaryFlags, ["L", "G"]);

    const item3 = results[3];
    assert.ok(item3);
    assert.equal(item3.item, "Kahvi / tee & jälkiruoka");
    assert.deepEqual(item3.dietaryFlags, []);
  });

  void it("parseIntraAllRestaurants parses all 3 restaurants at once", () => {
    const allMenus = parseIntraAllRestaurants(rawData, "2026-08-21");

    assert.equal(allMenus.huoltamo.length, 9);
    assert.equal(allMenus["studio-10"].length, 4);
    assert.equal(allMenus.piccolo.length, 4);
  });

  void it("parseHuoltamoResponse backward compatibility helper works", () => {
    const results = parseHuoltamoResponse(rawData, "2026-08-21");
    assert.equal(results.length, 9);
    const item0 = results[0];
    assert.ok(item0);
    assert.equal(item0.item, "Fish remoulade burger");
  });

  void it("parseIntraResponse handles days with no menu for a restaurant", () => {
    const results = parseIntraResponse(rawData, "studio-10", "1999-01-01");
    assert.deepEqual(results, []);
  });
});
