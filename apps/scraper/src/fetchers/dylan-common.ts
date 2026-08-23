import type { ParsedMenuItem } from "@acme/shared-types";

import { getHelsinkiDateString, parseDietaryFlags } from "./intra.js";

/**
 * Regex for filtering out general buffet boilerplate or salad bar descriptions.
 */
export const BOILERPLATE_REGEX =
  /buffetlounas|salaattipöyd|kysy tarvittaessa|lounas sisältää/i;

/**
 * Known Finnish dietary flag tokens for trailing match without parentheses.
 */
export const KNOWN_DIET_FLAGS = new Set([
  "g",
  "gl",
  "l",
  "vl",
  "m",
  "v",
  "veg",
  "vegaaninen",
  "k",
  "kasvis",
  "mu",
  "s",
  "vs",
]);

/**
 * Unescapes basic XML entities.
 */
export function unescapeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Extracts tag content handling optional CDATA wrappers.
 */
export function extractTagContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(
    `<${tagName}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tagName}>`,
    "i",
  );
  const match = regex.exec(xml);
  if (!match) return null;
  const content = match[1] ?? match[2] ?? "";
  return unescapeXml(content).trim();
}

export function normalizeName(name: string): string {
  let clean = name.trim();
  if (clean.startsWith("Aamupuuro:") && !clean.startsWith("Aamupuuro: ")) {
    clean = clean.replace(/^Aamupuuro:/, "Aamupuuro: ");
  }
  return clean;
}

/**
 * Extracts dietary flags from a dish line either in parentheses (L, G) or trailing tokens (M, G).
 */
export function extractDietaryFlagsFromLine(line: string): {
  itemName: string;
  dietaryFlags: string[];
} {
  const trimmed = line.trim();

  // Format A: Line ends with parenthesized dietary flags, e.g. "Kesäkeittoa ja rakuunaöljyä (L, G)"
  const parenMatch = /^(.*?)\s*\(([^)]+)\)$/.exec(trimmed);
  if (parenMatch) {
    const rawName = parenMatch[1]?.trim() ?? "";
    const rawDiet = parenMatch[2]?.trim() ?? "";
    if (rawName) {
      return {
        itemName: normalizeName(rawName),
        dietaryFlags: parseDietaryFlags(rawDiet),
      };
    }
  }

  // Format B: Trailing comma- or space-separated dietary flags without parentheses, e.g. "Kanakeitto M, G" or "Porkkanakakku L"
  const trailingPattern = /[\s,]+([A-Za-z0-9]+)$/;
  const collectedFlags: string[] = [];
  let workingLine = trimmed;

  while (true) {
    const m = trailingPattern.exec(workingLine);
    if (!m?.[1]) break;
    const token = m[1];
    if (KNOWN_DIET_FLAGS.has(token.toLowerCase())) {
      collectedFlags.unshift(token);
      workingLine = workingLine.slice(0, m.index).trim();
    } else {
      break;
    }
  }

  if (collectedFlags.length > 0 && workingLine.length > 0) {
    return {
      itemName: normalizeName(workingLine),
      dietaryFlags: collectedFlags,
    };
  }

  return {
    itemName: normalizeName(trimmed),
    dietaryFlags: [],
  };
}

/**
 * Parses an individual dish line from Dylan's menu description.
 */
export function parseDylanLine(
  line: string,
  targetDate: string,
): ParsedMenuItem | null {
  const trimmed = line.trim();
  if (!trimmed || BOILERPLATE_REGEX.test(trimmed)) {
    return null;
  }

  const { itemName, dietaryFlags } = extractDietaryFlagsFromLine(trimmed);
  if (!itemName) return null;

  return {
    date: targetDate,
    item: itemName,
    dietaryFlags,
  };
}

/**
 * Parses menu items from the HTML/text description block for a given date.
 */
export function parseDylanDescription(
  descriptionHtml: string,
  targetDate: string,
): ParsedMenuItem[] {
  if (!descriptionHtml) return [];

  // Replace line breaks with newlines and strip extraneous HTML tags
  const normalized = descriptionHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const lines = normalized.split(/\r?\n/);
  const items: ParsedMenuItem[] = [];

  for (const line of lines) {
    const parsed = parseDylanLine(line, targetDate);
    if (parsed) {
      items.push(parsed);
    }
  }

  return items;
}

/**
 * Generic parser for Dylan RSS XML feeds (Lounastaja).
 */
export function parseDylanRss(
  xmlText: string,
  targetDate: string = getHelsinkiDateString(),
  restaurantName = "Dylan",
): ParsedMenuItem[] {
  if (!xmlText) return [];

  const itemRegex = /<item(?:[\s\S]*?)>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    if (!itemXml) continue;

    const title = extractTagContent(itemXml, "title") ?? "";
    const pubDate = extractTagContent(itemXml, "pubDate") ?? "";
    const description = extractTagContent(itemXml, "description") ?? "";

    // Determine the date of this RSS item
    let itemDateStr: string | null = null;

    if (pubDate) {
      try {
        itemDateStr = getHelsinkiDateString(new Date(pubDate));
      } catch {
        itemDateStr = null;
      }
    }

    // Match if date matches the target date
    if (itemDateStr === targetDate) {
      return parseDylanDescription(description, targetDate);
    }

    // If pubDate is not matching or invalid, check if this is the only item in current-day feed
    // or fallback if targetDate wasn't provided or pubDate wasn't available
    if (!itemDateStr && title) {
      return parseDylanDescription(description, targetDate);
    }
  }

  // If no matching item by date was found, check if it was a single-item feed
  const singleItemMatch = /<item(?:[\s\S]*?)>([\s\S]*?)<\/item>/i.exec(xmlText);
  if (singleItemMatch?.[1]) {
    const description =
      extractTagContent(singleItemMatch[1], "description") ?? "";
    const pubDate = extractTagContent(singleItemMatch[1], "pubDate");
    if (pubDate) {
      try {
        const itemDate = getHelsinkiDateString(new Date(pubDate));
        if (itemDate === targetDate) {
          return parseDylanDescription(description, targetDate);
        }
      } catch {
        // Fallback
      }
    }
  }

  console.log(
    `[${restaurantName}] No menu entry found for ${restaurantName} on date ${targetDate}`,
  );
  return [];
}

export interface FetchDylanMenuOptions {
  restaurantName: string;
  targetDate?: string;
  rssUrl: string;
}

/**
 * Generic fetcher for Dylan RSS feeds.
 */
export async function fetchDylanMenuGeneric({
  restaurantName,
  targetDate = getHelsinkiDateString(),
  rssUrl,
}: FetchDylanMenuOptions): Promise<ParsedMenuItem[]> {
  const targetUrl = rssUrl.replace(/^["']|["']$/g, "").trim();
  console.log(
    `[${restaurantName}] Fetching menu for date ${targetDate} from RSS (${targetUrl})...`,
  );

  const response = await fetch(targetUrl, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `[${restaurantName}] RSS request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const xmlText = await response.text();
  const menuItems = parseDylanRss(xmlText, targetDate, restaurantName);

  console.log(
    `[${restaurantName}] Successfully fetched ${menuItems.length} menu items for ${restaurantName} on ${targetDate}`,
  );

  return menuItems;
}
