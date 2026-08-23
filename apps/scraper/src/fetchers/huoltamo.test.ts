import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

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

void describe("huoltamo fetcher (compatibility)", () => {
  void it("getHelsinkiDateString formats UTC timestamps to Europe/Helsinki date", () => {
    const formatted = getHelsinkiDateString("2026-08-16T21:00:00.000Z");
    assert.equal(formatted, "2026-08-17");

    const formatted2 = getHelsinkiDateString("2026-08-20T21:00:00.000Z");
    assert.equal(formatted2, "2026-08-21");
  });

  void it("parseDietaryFlags parses various diet formats correctly", () => {
    assert.deepEqual(parseDietaryFlags("G,Veg"), ["G", "Veg"]);
    assert.deepEqual(parseDietaryFlags("(L, G)"), ["L", "G"]);
  });

  void it("parseHuoltamoResponse extracts correct items for Huoltamo on 2026-08-21", () => {
    const samplePath = path.resolve(
      __dirname,
      "../../../../docs/huoltamo-api-sample-response-data.json",
    );
    const rawData = JSON.parse(
      fs.readFileSync(samplePath, "utf8"),
    ) as TestRawApiResponse;

    const results = parseHuoltamoResponse(rawData, "2026-08-21");

    assert.equal(results.length, 9);
    assert.equal(results[0]?.item, "Fish remoulade burger");
  });
});
