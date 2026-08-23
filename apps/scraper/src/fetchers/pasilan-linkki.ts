import type { ParsedMenuItem } from "@acme/shared-types";

import { extractTagContent, unescapeXml } from "./dylan-common.js";
import { getHelsinkiDateString } from "./intra.js";

export const PASILAN_LINKKI_RESTAURANT_ID = "pasilan-linkki";
export const PASILAN_LINKKI_RESTAURANT_NAME = "Pasilan Linkki";
export const PASILAN_LINKKI_DEFAULT_RSS_URL =
  "https://www.compass-group.fi/menuapi/feed/rss/current-day?costNumber=3642&language=fi";

/**
 * Regex for filtering out general buffet boilerplate or salad bar descriptions in Compass Group feeds.
 */
export const COMPASS_BOILERPLATE_REGEX = /^lounas\s+buffet/i;

/**
 * Decodes HTML entities commonly found in Compass Group feeds.
 */
export function decodeHtmlEntities(str: string): string {
  return unescapeXml(str)
    .replace(/&euro;/gi, "€")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&aring;/g, "å")
    .replace(/&Aring;/g, "Å")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’");
}

/**
 * Parses an individual dish line from Compass Group menu description.
 */
export function parseCompassLine(
  line: string,
  targetDate: string,
): ParsedMenuItem | null {
  const cleaned = decodeHtmlEntities(line).trim();
  if (!cleaned || COMPASS_BOILERPLATE_REGEX.test(cleaned)) {
    return null;
  }

  // Extract all parenthesized flags: e.g. (*, A, G, L) or (A, G, VS)
  const flagRegex = /\(([^)]+)\)/g;
  const flags: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = flagRegex.exec(cleaned)) !== null) {
    const rawFlags =
      m[1]
        ?.split(/[,/ ]+/)
        .map((f) => f.trim())
        .filter(Boolean) ?? [];
    for (const f of rawFlags) {
      if (!flags.includes(f)) {
        flags.push(f);
      }
    }
  }

  // Clean item name by removing parenthesized groups and extra whitespace
  const itemName = cleaned
    .replace(/\([^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!itemName) return null;

  return {
    date: targetDate,
    item: itemName,
    dietaryFlags: flags,
  };
}

/**
 * Parses menu items from the HTML/text description block for a given date.
 */
export function parseCompassDescription(
  descriptionHtml: string,
  targetDate: string,
): ParsedMenuItem[] {
  if (!descriptionHtml) return [];

  // Replace <p> and <br> tags with newlines and strip remaining tags
  const normalized = descriptionHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const lines = normalized.split(/\r?\n/);
  const items: ParsedMenuItem[] = [];

  for (const line of lines) {
    const parsed = parseCompassLine(line, targetDate);
    if (parsed) {
      items.push(parsed);
    }
  }

  return items;
}

/**
 * Extracts ISO date string (YYYY-MM-DD) from title, guid or pubDate in Compass Group RSS item.
 */
export function extractCompassItemDate(itemXml: string): string | null {
  const title = extractTagContent(itemXml, "title") ?? "";
  const guid = extractTagContent(itemXml, "guid") ?? "";
  const pubDate = extractTagContent(itemXml, "pubDate") ?? "";

  // 1. Try DD-MM-YYYY in title (e.g. "Perjantai, 21-08-2026" or "21-08-2026")
  const titleDateMatch = /(\d{1,2})[-.](\d{1,2})[-.](\d{4})/.exec(title);
  if (titleDateMatch?.[1] && titleDateMatch[2] && titleDateMatch[3]) {
    const day = titleDateMatch[1].padStart(2, "0");
    const month = titleDateMatch[2].padStart(2, "0");
    const year = titleDateMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 2. Try DD-MM-YYYY in guid (e.g. "...#21-08-2026")
  const guidDateMatch = /(\d{1,2})[-.](\d{1,2})[-.](\d{4})/.exec(guid);
  if (guidDateMatch?.[1] && guidDateMatch[2] && guidDateMatch[3]) {
    const day = guidDateMatch[1].padStart(2, "0");
    const month = guidDateMatch[2].padStart(2, "0");
    const year = guidDateMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 3. Try pubDate if present
  if (pubDate) {
    try {
      return getHelsinkiDateString(new Date(pubDate));
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Parses Pasilan Linkki (Compass Group) RSS XML feed.
 */
export function parsePasilanLinkkiRss(
  xmlText: string,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  if (!xmlText) return [];

  const itemRegex = /<item(?:[\s\S]*?)>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    if (!itemXml) continue;

    const itemDateStr = extractCompassItemDate(itemXml);
    const description = extractTagContent(itemXml, "description") ?? "";

    if (itemDateStr === targetDate) {
      return parseCompassDescription(description, targetDate);
    }
  }

  // Fallback: If single item feed and date couldn't be extracted, check if only one item exists
  const singleItemMatch = /<item(?:[\s\S]*?)>([\s\S]*?)<\/item>/i.exec(xmlText);
  if (singleItemMatch?.[1]) {
    const itemXml = singleItemMatch[1];
    const itemDateStr = extractCompassItemDate(itemXml);
    const description = extractTagContent(itemXml, "description") ?? "";

    if (!itemDateStr && description) {
      return parseCompassDescription(description, targetDate);
    }
  }

  console.log(
    `[${PASILAN_LINKKI_RESTAURANT_NAME}] No menu entry found for ${PASILAN_LINKKI_RESTAURANT_NAME} on date ${targetDate}`,
  );
  return [];
}

/**
 * Fetches and parses menu items for Pasilan Linkki from its RSS feed.
 */
export async function fetchPasilanLinkkiMenu(
  targetDate: string = getHelsinkiDateString(),
  rssUrl: string = process.env.PASILAN_LINKKI_RSS_URL ??
    process.env.PASILAN_LINKKI_URL ??
    process.env.LINKKI_RSS_URL ??
    PASILAN_LINKKI_DEFAULT_RSS_URL,
): Promise<ParsedMenuItem[]> {
  const targetUrl = rssUrl.replace(/^["']|["']$/g, "").trim();
  console.log(
    `[${PASILAN_LINKKI_RESTAURANT_NAME}] Fetching menu for date ${targetDate} from RSS (${targetUrl})...`,
  );

  const response = await fetch(targetUrl, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `[${PASILAN_LINKKI_RESTAURANT_NAME}] RSS request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const xmlText = await response.text();
  const menuItems = parsePasilanLinkkiRss(xmlText, targetDate);

  console.log(
    `[${PASILAN_LINKKI_RESTAURANT_NAME}] Successfully fetched ${menuItems.length} menu items for ${PASILAN_LINKKI_RESTAURANT_NAME} on ${targetDate}`,
  );

  return menuItems;
}
