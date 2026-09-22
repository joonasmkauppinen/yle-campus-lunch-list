import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  getHelsinkiDateString,
  parseDietaryFlags,
  parseHuoltamoResponse,
} from "./huoltamo.js";

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

describe("huoltamo fetcher (compatibility)", () => {
  it("getHelsinkiDateString formats UTC timestamps to Europe/Helsinki date", () => {
    const formatted = getHelsinkiDateString("2026-08-16T21:00:00.000Z");
    expect(formatted).toBe("2026-08-17");

    const formatted2 = getHelsinkiDateString("2026-08-20T21:00:00.000Z");
    expect(formatted2).toBe("2026-08-21");
  });

  it("parseDietaryFlags parses various diet formats correctly", () => {
    expect(parseDietaryFlags("G,Veg")).toEqual(["G", "Veg"]);
    expect(parseDietaryFlags("(L, G)")).toEqual(["L", "G"]);
  });

  it("parseHuoltamoResponse extracts correct items for Huoltamo on 2026-08-21", () => {
    const samplePath = path.resolve(
      __dirname,
      "../../../../docs/huoltamo-api-sample-response-data.json",
    );
    const rawData = JSON.parse(
      fs.readFileSync(samplePath, "utf8"),
    ) as TestRawApiResponse;

    const results = parseHuoltamoResponse(rawData, "2026-08-21");

    expect(results.length).toBe(9);
    expect(results[0]?.item).toBe("Fish remoulade burger");
  });
});
