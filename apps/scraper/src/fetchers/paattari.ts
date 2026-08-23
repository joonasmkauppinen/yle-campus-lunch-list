import * as cheerio from "cheerio";

import type { ParsedMenuItem } from "@acme/shared-types";

import { getHelsinkiDateString } from "./intra.js";

export const PAATTARI_RESTAURANT_ID = "paattari";
export const PAATTARI_RESTAURANT_NAME = "Päättäri";
export const PAATTARI_DEFAULT_URL =
  "https://nordrest.fi/restaurang/ravintola-paattari/#ruokalista";

/**
 * Regex for filtering out general category headings, allergen notes, prices or boilerplate in Päättäri / Nordrest pages.
 */
export const PAATTARI_BOILERPLATE_REGEX =
  /^(huomioimme myös.*|lisätietoja.*|lounaan hinta.*|hintaan sisältyy.*|el[äa]kel[äa]isille.*|sulkemisaikaan.*|mik[äa]li yrityksesi.*|tervetuloa.*|aukioloajat.*|viikko\s*\d+|lounaslista\s*viikko.*|lounaslista|hinnat.*|kokoustarjoilu.*|yhteystiedot.*|ravintola\s*p[äa][äa]tt[äa]ri|allergeenit.*)$/i;

/**
 * Known Finnish dietary flag tokens used at Päättäri / Nordrest.
 */
export const PAATTARI_KNOWN_FLAGS = new Set([
  "l",
  "g",
  "vl",
  "m",
  "km",
  "k",
  "veg",
  "ve",
  "v",
  "gl",
  "vs",
  "mu",
]);

/**
 * Decodes HTML entities commonly found in web pages.
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8211;/g, "–")
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
 * Parses an individual dish line from Päättäri menu content.
 */
export function parsePaattariLine(
  rawLine: string,
  targetDate: string,
): ParsedMenuItem | null {
  const cleaned = decodeHtmlEntities(rawLine)
    .replace(/\u00a0/g, " ")
    .trim();
  if (!cleaned || PAATTARI_BOILERPLATE_REGEX.test(cleaned)) {
    return null;
  }

  // Remove prices (e.g. 14,00€, 12,70€, 10,00 €)
  let text = cleaned.replace(/\d{1,2}[,.]\d{2}\s*€|\d{1,2}\s*€/gi, "").trim();

  const flags: string[] = [];

  // 1. Extract parenthesized flags: e.g. (L, G), (L,G), (V, G), (L), (Ve)
  text = text.replace(/\(([^)]+)\)/g, (match, group: string) => {
    const parts = group
      .split(/[,/ ]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    let allFlags = true;
    for (const p of parts) {
      if (PAATTARI_KNOWN_FLAGS.has(p.toLowerCase())) {
        const upper = p.toUpperCase();
        if (!flags.includes(upper)) flags.push(upper);
      } else {
        allFlags = false;
      }
    }
    return allFlags ? "" : match;
  });

  // 2. Extract standalone known dietary flag sequences (e.g., "M,G,KM", "L,G", "M,Veg", "L")
  const flagsPattern = new RegExp(
    `(?<![a-zA-ZäöåÄÖÅ])(?:(?:${Array.from(PAATTARI_KNOWN_FLAGS).join("|")})(?:\\s*,\\s*|\\s+|$))+`,
    "gi",
  );

  text = text.replace(flagsPattern, (match) => {
    const parts = match
      .split(/[,/ ]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of parts) {
      const upper = p.toUpperCase();
      if (PAATTARI_KNOWN_FLAGS.has(p.toLowerCase()) && !flags.includes(upper)) {
        flags.push(upper);
      }
    }
    return " ";
  });

  // 3. Clean up dish name and standardize slashes
  const itemName = text
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .replace(/\s*–\s*$/, "")
    .replace(/,\s*$/, "")
    .replace(/\s*-\s*$/, "")
    .replace(/\s+,\s*/g, ", ")
    .replace(/,\s*,+/g, ",")
    .trim();

  if (!itemName || PAATTARI_BOILERPLATE_REGEX.test(itemName)) {
    return null;
  }

  return {
    date: targetDate,
    item: itemName,
    dietaryFlags: flags,
  };
}

/**
 * Extracts ISO date string (YYYY-MM-DD) from a heading string like "Maanantai 17.8.2026" or "Torstai 20.8.".
 */
export function extractPaattariHeadingDate(
  headingText: string,
  targetDateYear = new Date().getFullYear().toString(),
): string | null {
  const clean = decodeHtmlEntities(headingText).replace(/\s+/g, " ").trim();
  if (/viikko\s*\d+/i.test(clean) && !/\d{1,2}\.\d{1,2}\./.test(clean)) {
    return null;
  }

  const dateMatch =
    /(?:maanantai|tiistai|keskiviikko|torstai|perjantai|lauantai|sunnuntai|ma|ti|ke|to|pe|la|su)?\s*(\d{1,2})\.(\d{1,2})\.?(?:\s*(\d{4}))?/i.exec(
      clean,
    );
  if (!dateMatch?.[1] || !dateMatch[2]) return null;

  const day = dateMatch[1].padStart(2, "0");
  const month = dateMatch[2].padStart(2, "0");
  const year = dateMatch[3] ?? targetDateYear;

  return `${year}-${month}-${day}`;
}

/**
 * Parses Päättäri HTML page and extracts menu items for the target date.
 */
export function parsePaattariHtml(
  htmlText: string,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  if (!htmlText) return [];

  const $ = cheerio.load(htmlText);
  const targetYear = targetDate.slice(0, 4);

  // Remove footers, alert boxes, hidden elementor containers, script and style tags
  $(
    ".elementor-hidden-desktop, .fusion-footer, footer, script, style",
  ).remove();

  let container = $(
    "#ruokalista .elementor-widget-shortcode .elementor-shortcode, #ruokalista .elementor-widget-text-editor",
  ).first();

  if (!container.length) {
    container = $("#ruokalista, main, body").first();
  }

  const results: ParsedMenuItem[] = [];
  const seenItems = new Set<string>();
  let currentMatchedDate: string | null = null;

  const elements = container.find("p, div, h2, h3, h4, h5, li");

  elements.each((_, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, " ").trim();

    if ($el.is("p, div, h2, h3, h4, h5") && text.length < 40) {
      const dateIso = extractPaattariHeadingDate(text, targetYear);
      if (dateIso) {
        currentMatchedDate = dateIso;
        return;
      }
    }

    if (currentMatchedDate === targetDate) {
      if ($el.is("li")) {
        const liText = $el.text().replace(/\s+/g, " ").trim();
        if (liText) {
          const parsed = parsePaattariLine(liText, targetDate);
          if (parsed && !seenItems.has(parsed.item)) {
            seenItems.add(parsed.item);
            results.push(parsed);
          }
        }
      } else if ($el.is("p") && !$el.find("ul, ol").length) {
        const parsed = parsePaattariLine(text, targetDate);
        if (parsed && !seenItems.has(parsed.item)) {
          seenItems.add(parsed.item);
          results.push(parsed);
        }
      }
    }
  });

  if (results.length === 0) {
    console.log(
      `[${PAATTARI_RESTAURANT_NAME}] No menu entry found for ${PAATTARI_RESTAURANT_NAME} on date ${targetDate}`,
    );
  }

  return results;
}

/**
 * Fetches and parses menu items for Päättäri from its website.
 */
export async function fetchPaattariMenu(
  targetDate: string = getHelsinkiDateString(),
  url: string = process.env.PAATTARI_URL ??
    process.env.PAATTARI_WEBSITE_URL ??
    PAATTARI_DEFAULT_URL,
): Promise<ParsedMenuItem[]> {
  const targetUrl = url.replace(/^["']|["']$/g, "").trim();
  console.log(
    `[${PAATTARI_RESTAURANT_NAME}] Fetching menu for date ${targetDate} from website (${targetUrl})...`,
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
      `[${PAATTARI_RESTAURANT_NAME}] Website request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const htmlText = await response.text();
  const menuItems = parsePaattariHtml(htmlText, targetDate);

  console.log(
    `[${PAATTARI_RESTAURANT_NAME}] Successfully fetched ${menuItems.length} menu items for ${PAATTARI_RESTAURANT_NAME} on ${targetDate}`,
  );

  return menuItems;
}
