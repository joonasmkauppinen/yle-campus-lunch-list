import * as cheerio from "cheerio";

import type { ParsedMenuItem } from "@acme/shared-types";

import { getHelsinkiDateString } from "./intra.js";

export const ISO_PAJA_RESTAURANT_ID = "iso-paja";
export const ISO_PAJA_RESTAURANT_NAME = "Iso Paja";
export const ISO_PAJA_DEFAULT_URL = "https://www.hhravintolat.fi/iso-paja/";

/**
 * Regex for matching Iso Paja menu category subtitles.
 */
export const ISO_PAJA_SUBTITLE_REGEX =
  /^(buffet\s*menu|vege\s*menu|kasvis\s*menu|street\s*kitchen|aamupuuro|puuroaamiainen)$/i;

/**
 * Regex for filtering out general category headings or boilerplate in HH-ravintolat (Iso Paja) pages.
 */
export const ISO_PAJA_BOILERPLATE_REGEX =
  /^(lounas\s*buffet|lounas|salaatti-?deli|h[äa]vikkimyynti)$/i;

/**
 * Normalizes subtitle heading strings to standardized uppercase display titles.
 */
export function normalizeIsoPajaSubtitle(text: string): string {
  if (/^buffet\s*menu$/i.test(text)) return "BUFFET MENU";
  if (/^(vege\s*menu|kasvis\s*menu)$/i.test(text)) return "VEGE MENU";
  if (/^street\s*kitchen$/i.test(text)) return "STREET KITCHEN";
  if (/^(aamupuuro|puuroaamiainen)$/i.test(text)) return "AAMUPUURO";
  return text.toUpperCase();
}

/**
 * Decodes HTML entities commonly found in Iso Paja web pages.
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&euro;/gi, "€")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&aring;/g, "å")
    .replace(/&Aring;/g, "Å")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Parses an individual dish line or subtitle from Iso Paja menu content.
 */
export function parseIsoPajaLine(
  rawLine: string,
  targetDate: string,
  _currentCategory = "",
): ParsedMenuItem | null {
  const cleaned = decodeHtmlEntities(rawLine)
    .replace(/\u00a0/g, " ")
    .trim();
  if (!cleaned || ISO_PAJA_BOILERPLATE_REGEX.test(cleaned)) {
    return null;
  }

  // If this line is a category subtitle (Buffet Menu, Vege Menu, Street Kitchen, Aamupuuro), return it as a menu item
  if (ISO_PAJA_SUBTITLE_REGEX.test(cleaned)) {
    return {
      date: targetDate,
      item: normalizeIsoPajaSubtitle(cleaned),
      dietaryFlags: [],
    };
  }

  // Extract parenthesized dietary flags: e.g. (L, G), (Ve), (VL), (M, G)
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
      if (/^[A-Za-z*]{1,4}$/.test(f) && !flags.includes(f)) {
        flags.push(f);
      }
    }
  }

  // Clean parenthesized dietary flag groups from item name
  let itemName = cleaned
    .replace(/\((?:[A-Za-z*]{1,4}(?:,\s*)?)+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Clean trailing punctuation or dangling dashes
  itemName = itemName
    .replace(/\s*–\s*$/, "")
    .replace(/,\s*$/, "")
    .trim();

  if (!itemName) return null;

  return {
    date: targetDate,
    item: itemName,
    dietaryFlags: flags,
  };
}

/**
 * Extracts ISO date string (YYYY-MM-DD) from a heading string like "MAANANTAI 24.8." or "24.8.2026".
 */
export function extractIsoPajaHeadingDate(
  headingText: string,
  targetDateYear = new Date().getFullYear().toString(),
): string | null {
  const dateMatch = /(\d{1,2})\.(\d{1,2})\.?(?:\s*(\d{4}))?/.exec(headingText);
  if (!dateMatch?.[1] || !dateMatch[2]) return null;

  const day = dateMatch[1].padStart(2, "0");
  const month = dateMatch[2].padStart(2, "0");
  const year = dateMatch[3] ?? targetDateYear;

  return `${year}-${month}-${day}`;
}

/**
 * Parses Iso Paja HTML page and extracts menu items for the target date.
 */
export function parseIsoPajaHtml(
  htmlText: string,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  if (!htmlText) return [];

  const $ = cheerio.load(htmlText);
  const container = $(
    "#lunchmenu-14, details:has(.showlunch), main, body",
  ).first();
  const headings = container.find("h4, h3, h2");
  const targetYear = targetDate.slice(0, 4);
  const results: ParsedMenuItem[] = [];

  headings.each((_, hEl) => {
    const headingText = $(hEl).text().replace(/\s+/g, " ").trim();
    if (!headingText) return;

    const dayIso = extractIsoPajaHeadingDate(headingText, targetYear);
    if (!dayIso || dayIso !== targetDate) {
      return;
    }

    // Collect subsequent sibling elements until the next day heading
    let curr = $(hEl).next();
    let currentCategory = "";

    while (curr.length > 0 && !curr.is("h4, h3, h2")) {
      const pHtml = curr.html() ?? "";
      // Handle <br> tags within paragraphs as separate lines
      const lines = pHtml.split(/<br\s*\/?>/i);

      for (const lineHtml of lines) {
        const lineText = cheerio
          .load(lineHtml)
          .text()
          .replace(/\s+/g, " ")
          .trim();
        if (!lineText) continue;

        if (ISO_PAJA_BOILERPLATE_REGEX.test(lineText)) {
          continue;
        }

        if (ISO_PAJA_SUBTITLE_REGEX.test(lineText)) {
          currentCategory = lineText;
        }

        const parsed = parseIsoPajaLine(lineText, dayIso, currentCategory);
        if (parsed) {
          results.push(parsed);
        }
      }

      curr = curr.next();
    }
  });

  if (results.length === 0) {
    console.log(
      `[${ISO_PAJA_RESTAURANT_NAME}] No menu entry found for ${ISO_PAJA_RESTAURANT_NAME} on date ${targetDate}`,
    );
  }

  return results;
}

/**
 * Fetches and parses menu items for Iso Paja from its website.
 */
export async function fetchIsoPajaMenu(
  targetDate: string = getHelsinkiDateString(),
  url: string = process.env.ISO_PAJA_URL ?? ISO_PAJA_DEFAULT_URL,
): Promise<ParsedMenuItem[]> {
  const targetUrl = url.replace(/^["']|["']$/g, "").trim();
  console.log(
    `[${ISO_PAJA_RESTAURANT_NAME}] Fetching menu for date ${targetDate} from website (${targetUrl})...`,
  );

  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `[${ISO_PAJA_RESTAURANT_NAME}] Website request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const htmlText = await response.text();
  const menuItems = parseIsoPajaHtml(htmlText, targetDate);

  console.log(
    `[${ISO_PAJA_RESTAURANT_NAME}] Successfully fetched ${menuItems.length} menu items for ${ISO_PAJA_RESTAURANT_NAME} on ${targetDate}`,
  );

  return menuItems;
}
