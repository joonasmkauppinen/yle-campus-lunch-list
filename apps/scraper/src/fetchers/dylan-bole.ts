import type { ParsedMenuItem } from "@acme/shared-types";

import { fetchDylanMenuGeneric, parseDylanRss } from "./dylan-common.js";
import { getHelsinkiDateString } from "./intra.js";

export const DYLAN_BOLE_RESTAURANT_ID = "dylan-bole";
export const DYLAN_BOLE_RESTAURANT_NAME = "Dylan Böle";
export const DYLAN_BOLE_DEFAULT_RSS_URL =
  "https://lounastaja.app/api/v1/rss/week/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/current?days=current&language=fi";

/**
 * Parses Dylan Böle RSS XML feed and extracts menu items for the target date.
 */
export function parseDylanBoleRss(
  xmlText: string,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  return parseDylanRss(xmlText, targetDate, DYLAN_BOLE_RESTAURANT_NAME);
}

/**
 * Fetches and parses menu items for Dylan Böle from its RSS feed.
 */
export async function fetchDylanBoleMenu(
  targetDate: string = getHelsinkiDateString(),
  rssUrl: string = process.env.DYLAN_BOLE_RSS_URL ??
    process.env.DYLAN_BOLE_URL ??
    DYLAN_BOLE_DEFAULT_RSS_URL,
): Promise<ParsedMenuItem[]> {
  return fetchDylanMenuGeneric({
    restaurantName: DYLAN_BOLE_RESTAURANT_NAME,
    targetDate,
    rssUrl,
  });
}
