import type { ParsedMenuItem } from "@acme/shared-types";

import { fetchDylanMenuGeneric, parseDylanRss } from "./dylan-common.js";
import { getHelsinkiDateString } from "./intra.js";

export const DYLAN_LA_ILMA_RESTAURANT_ID = "dylan-la-ilma";
export const DYLAN_LA_ILMA_RESTAURANT_NAME = "Dylan La Ilma";
export const DYLAN_LA_ILMA_DEFAULT_RSS_URL =
  "https://lounastaja.app/api/v1/rss/week/70835b81-ec1f-443f-92bb-9832d21fb3af/current?days=current&language=fi";

/**
 * Parses Dylan La Ilma RSS XML feed and extracts menu items for the target date.
 */
export function parseDylanLaIlmaRss(
  xmlText: string,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  return parseDylanRss(xmlText, targetDate, DYLAN_LA_ILMA_RESTAURANT_NAME);
}

/**
 * Fetches and parses menu items for Dylan La Ilma from its RSS feed.
 */
export async function fetchDylanLaIlmaMenu(
  targetDate: string = getHelsinkiDateString(),
  rssUrl: string = process.env.DYLAN_LA_ILMA_RSS_URL ??
    process.env.DYLAN_LA_ILMA_URL ??
    DYLAN_LA_ILMA_DEFAULT_RSS_URL,
): Promise<ParsedMenuItem[]> {
  return fetchDylanMenuGeneric({
    restaurantName: DYLAN_LA_ILMA_RESTAURANT_NAME,
    targetDate,
    rssUrl,
  });
}
