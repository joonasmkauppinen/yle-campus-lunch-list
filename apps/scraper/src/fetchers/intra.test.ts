import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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

describe("intra fetcher", () => {
  const samplePath = path.resolve(
    __dirname,
    "../../../../docs/huoltamo-api-sample-response-data.json",
  );
  const rawData = JSON.parse(
    fs.readFileSync(samplePath, "utf8"),
  ) as TestRawApiResponse;

  it("getHelsinkiDateString formats UTC timestamps to Europe/Helsinki date", () => {
    // 2026-08-16T21:00:00.000Z is 2026-08-17 00:00:00 EEST (UTC+3)
    const formatted = getHelsinkiDateString("2026-08-16T21:00:00.000Z");
    expect(formatted).toBe("2026-08-17");

    const formatted2 = getHelsinkiDateString("2026-08-20T21:00:00.000Z");
    expect(formatted2).toBe("2026-08-21");
  });

  it("parseDietaryFlags parses various diet formats correctly", () => {
    expect(parseDietaryFlags("G,Veg")).toEqual(["G", "Veg"]);
    expect(parseDietaryFlags("(L, G)")).toEqual(["L", "G"]);
    expect(parseDietaryFlags("(L)")).toEqual(["L"]);
    expect(parseDietaryFlags("(V, G)")).toEqual(["V", "G"]);
    expect(parseDietaryFlags("VL,G, Vegaaninen keittiöstä")).toEqual([
      "VL",
      "G",
      "Vegaaninen keittiöstä",
    ]);
    expect(parseDietaryFlags("")).toEqual([]);
    expect(parseDietaryFlags(undefined)).toEqual([]);
  });

  it("parseIntraResponse extracts correct items for Huoltamo on 2026-08-21", () => {
    const results = parseIntraResponse(rawData, "huoltamo", "2026-08-21");

    expect(results.length).toBe(9);
    const item0 = results[0];
    expect(item0).toBeTruthy();
    expect(item0?.item).toBe("Fish remoulade burger");
    expect(item0?.dietaryFlags).toEqual(["L"]);
    expect(item0?.date).toBe("2026-08-21");

    const item7 = results[7];
    expect(item7).toBeTruthy();
    expect(item7?.item).toBe("Jäätelöbaari 🍦🍬");
    expect(item7?.dietaryFlags).toEqual([]);

    const item8 = results[8];
    expect(item8).toBeTruthy();
    expect(item8?.item).toBe("Kahvi / tee");
  });

  it("parseIntraResponse extracts correct items for Studio 10 on 2026-08-21", () => {
    const results = parseIntraResponse(rawData, "studio-10", "2026-08-21");

    expect(results.length).toBe(4);
    const item0 = results[0];
    expect(item0).toBeTruthy();
    expect(item0?.item).toBe(
      "Pasta alla pancetta e panna - Kermaista pekonipastaa",
    );
    expect(item0?.dietaryFlags).toEqual(["L"]);
    expect(item0?.date).toBe("2026-08-21");

    const item1 = results[1];
    expect(item1).toBeTruthy();
    expect(item1?.item).toBe("Scorfano al pesto - Puna-ahventa & pestoa");
    expect(item1?.dietaryFlags).toEqual(["L", "G"]);

    const item2 = results[2];
    expect(item2).toBeTruthy();
    expect(item2?.item).toBe("Tacchino Cordon Bleu - Kalkkuna Cordon Bleu");
    expect(item2?.dietaryFlags).toEqual(["L"]);

    const item3 = results[3];
    expect(item3).toBeTruthy();
    expect(item3?.item).toBe("Zucchini al forno - Kesäkurpitsaa uunissa");
    expect(item3?.dietaryFlags).toEqual(["V", "G"]);
  });

  it("parseIntraResponse extracts correct items for Piccolo on 2026-08-21", () => {
    const results = parseIntraResponse(rawData, "piccolo", "2026-08-21");

    expect(results.length).toBe(4);
    const item0 = results[0];
    expect(item0).toBeTruthy();
    expect(item0?.item).toBe("Katkarapu-pastasalaattia");
    expect(item0?.dietaryFlags).toEqual([]);
    expect(item0?.date).toBe("2026-08-21");

    const item1 = results[1];
    expect(item1).toBeTruthy();
    expect(item1?.item).toBe("Raejuustosalaattia");
    expect(item1?.dietaryFlags).toEqual([]);

    const item2 = results[2];
    expect(item2).toBeTruthy();
    expect(item2?.item).toBe("Punajuurisosekeittoa");
    expect(item2?.dietaryFlags).toEqual(["L", "G"]);

    const item3 = results[3];
    expect(item3).toBeTruthy();
    expect(item3?.item).toBe("Kahvi / tee & jälkiruoka");
    expect(item3?.dietaryFlags).toEqual([]);
  });

  it("parseIntraAllRestaurants parses all 3 restaurants at once", () => {
    const allMenus = parseIntraAllRestaurants(rawData, "2026-08-21");

    expect(allMenus.huoltamo.length).toBe(9);
    expect(allMenus["studio-10"].length).toBe(4);
    expect(allMenus.piccolo.length).toBe(4);
  });

  it("parseHuoltamoResponse backward compatibility helper works", () => {
    const results = parseHuoltamoResponse(rawData, "2026-08-21");
    expect(results.length).toBe(9);
    const item0 = results[0];
    expect(item0).toBeTruthy();
    expect(item0?.item).toBe("Fish remoulade burger");
  });

  it("parseIntraResponse handles days with no menu for a restaurant", () => {
    const results = parseIntraResponse(rawData, "studio-10", "1999-01-01");
    expect(results).toEqual([]);
  });
});
