import type { ParsedMenuItem } from "@acme/shared-types";

import {
  extractDietaryFlagsFromLine,
  fetchDylanMenuGeneric,
  parseDylanDescription,
  parseDylanLine,
  parseDylanRss,
  unescapeXml,
} from "./dylan-common.js";
import { getHelsinkiDateString } from "./intra.js";

export const DYLAN_LUFT_RESTAURANT_ID = "dylan-luft";
export const DYLAN_LUFT_RESTAURANT_NAME = "Dylan Luft";
export const DYLAN_LUFT_DEFAULT_RSS_URL =
  "https://lounastaja.app/api/v1/rss/week/5843f3ec-6a2c-49ba-ba3e-b384f6c996f1/current?days=current&language=fi";

// Re-export common functions for backward compatibility
export {
  unescapeXml,
  extractDietaryFlagsFromLine,
  parseDylanLine,
  parseDylanDescription,
};

/**
 * Parses Dylan Luft RSS XML feed and extracts menu items for the target date.
 */
export function parseDylanLuftRss(
  xmlText: string,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  return parseDylanRss(xmlText, targetDate, DYLAN_LUFT_RESTAURANT_NAME);
}

/**
 * Fetches and parses menu items for Dylan Luft from its RSS feed.
 */
export async function fetchDylanLuftMenu(
  targetDate: string = getHelsinkiDateString(),
  rssUrl: string = process.env.DYLAN_LUFT_RSS_URL ??
    process.env.DYLAN_LUFT_URL ??
    DYLAN_LUFT_DEFAULT_RSS_URL,
): Promise<ParsedMenuItem[]> {
  return fetchDylanMenuGeneric({
    restaurantName: DYLAN_LUFT_RESTAURANT_NAME,
    targetDate,
    rssUrl,
  });
}
