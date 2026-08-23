import * as cheerio from "cheerio";

import type { ParsedMenuItem } from "@acme/shared-types";

import { getHelsinkiDateString } from "./intra.js";

export const AKSELI_RESTAURANT_ID = "akseli";
export const AKSELI_RESTAURANT_NAME = "Akseli";
export const AKSELI_DEFAULT_URL =
  "https://www.ninankeittio.fi/helsinki-ilmala-akseli/#lounaslista";

/**
 * Regex for filtering out general headers, allergen notes, prices or boilerplate in Ninan Keittiö (Akseli) pages.
 */
export const AKSELI_BOILERPLATE_REGEX =
  /^(allergeenit.*|käytämme suomalaista lihaa.*|tulosta lounaslista|lounasbuffetiin.*|keitto-salaattiin.*|keittolounas.*|miten onnistuimme|järjestä juhlat.*|kokoustilat|aamupuuro|puurobaari\s*\d|lounas|kahvila|kokoustarjottavat.*|viikko\s*\d+|[a-z]{1,4}\s*=\s*.+)$/i;

/**
 * Known Finnish dietary flag tokens used at Akseli.
 */
export const AKSELI_KNOWN_FLAGS = new Set([
  "l",
  "g",
  "vl",
  "m",
  "km",
  "k",
  "veg",
  "ve",
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
 * Parses an individual dish line from Akseli menu content.
 */
export function parseAkseliLine(
  rawLine: string,
  targetDate: string,
): ParsedMenuItem | null {
  const cleaned = decodeHtmlEntities(rawLine)
    .replace(/\u00a0/g, " ")
    .trim();
  if (!cleaned || AKSELI_BOILERPLATE_REGEX.test(cleaned)) {
    return null;
  }

  // Remove prices (e.g. 14,00€, 12,80€, 10,30 €)
  let text = cleaned.replace(/\d{1,2}[,.]\d{2}\s*€|\d{1,2}\s*€/gi, "").trim();

  const flags: string[] = [];

  // 1. Extract parenthesized flags: e.g. (L, G), (Veg), (VL), L(Veg)
  text = text.replace(/\(([^)]+)\)/g, (match, group: string) => {
    const parts = group
      .split(/[,/ ]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    let allFlags = true;
    for (const p of parts) {
      if (AKSELI_KNOWN_FLAGS.has(p.toLowerCase())) {
        if (!flags.includes(p)) flags.push(p);
      } else {
        allFlags = false;
      }
    }
    return allFlags ? "" : match;
  });

  // 2. Extract standalone known dietary flag sequences (e.g., "M,G,KM", "L,G", "M,Veg", "L")
  const flagsPattern = new RegExp(
    `(?<![a-zA-ZäöåÄÖÅ])(?:(?:${Array.from(AKSELI_KNOWN_FLAGS).join("|")})(?:\\s*,\\s*|\\s+|$))+`,
    "gi",
  );

  text = text.replace(flagsPattern, (match) => {
    const parts = match
      .split(/[,/ ]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of parts) {
      if (AKSELI_KNOWN_FLAGS.has(p.toLowerCase()) && !flags.includes(p)) {
        flags.push(p);
      }
    }
    return " ";
  });

  // 3. Clean up dish name
  const itemName = text
    .replace(/\s+/g, " ")
    .replace(/\s*–\s*$/, "")
    .replace(/,\s*$/, "")
    .replace(/\s*-\s*$/, "")
    .replace(/\s+,\s*/g, ", ")
    .replace(/,\s*,+/g, ",")
    .trim();

  if (!itemName || AKSELI_BOILERPLATE_REGEX.test(itemName)) {
    return null;
  }

  return {
    date: targetDate,
    item: itemName,
    dietaryFlags: flags,
  };
}

/**
 * Extracts ISO date string (YYYY-MM-DD) from a heading string like "Maanantai 17.8." or "Torstai 20.8.2026".
 */
export function extractAkseliHeadingDate(
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
 * Parses Akseli HTML page and extracts menu items for the target date.
 */
export function parseAkseliHtml(
  htmlText: string,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  if (!htmlText) return [];

  const $ = cheerio.load(htmlText);
  const targetYear = targetDate.slice(0, 4);

  // Remove alert boxes, footnote allergen cards, footers, scripts and styles
  $(
    ".fusion-alert, .alert, .pikkuteksti, .fusion-footer, footer, script, style",
  ).remove();

  const results: ParsedMenuItem[] = [];
  let currentMatchedDate: string | null = null;

  const elements = $(
    "#lounaslista .fusion-text-14 > *, #lounaslista p, #lounaslista ul, #lounaslista div.mce-path-item, main .fusion-text-14 > *",
  );

  elements.each((_, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, " ").trim();

    if ($el.is("p, div, h2, h3, h4") && text.length < 40) {
      const dateIso = extractAkseliHeadingDate(text, targetYear);
      if (dateIso) {
        currentMatchedDate = dateIso;
        return;
      }
    }

    if (currentMatchedDate === targetDate) {
      if ($el.is("ul, ol")) {
        $el.find("li").each((_, li) => {
          const liText = $(li).text().replace(/\s+/g, " ").trim();
          if (liText) {
            const parsed = parseAkseliLine(liText, targetDate);
            if (parsed) {
              results.push(parsed);
            }
          }
        });
      } else if ($el.is("p, div") && !$el.find("ul, ol").length) {
        const lines = ($el.html() ?? "").split(/<br\s*\/?>/i);
        for (const lineHtml of lines) {
          const lineText = cheerio
            .load(lineHtml)
            .text()
            .replace(/\s+/g, " ")
            .trim();
          if (lineText) {
            const parsed = parseAkseliLine(lineText, targetDate);
            if (parsed) {
              results.push(parsed);
            }
          }
        }
      }
    }
  });

  if (results.length === 0) {
    console.log(
      `[${AKSELI_RESTAURANT_NAME}] No menu entry found for ${AKSELI_RESTAURANT_NAME} on date ${targetDate}`,
    );
  }

  return results;
}

/**
 * Fetches and parses menu items for Akseli from its website.
 */
export async function fetchAkseliMenu(
  targetDate: string = getHelsinkiDateString(),
  url: string = process.env.AKSELI_URL ??
    process.env.AKSELI_WEBSITE_URL ??
    AKSELI_DEFAULT_URL,
): Promise<ParsedMenuItem[]> {
  const targetUrl = url.replace(/^["']|["']$/g, "").trim();
  console.log(
    `[${AKSELI_RESTAURANT_NAME}] Fetching menu for date ${targetDate} from website (${targetUrl})...`,
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
      `[${AKSELI_RESTAURANT_NAME}] Website request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const htmlText = await response.text();
  const menuItems = parseAkseliHtml(htmlText, targetDate);

  console.log(
    `[${AKSELI_RESTAURANT_NAME}] Successfully fetched ${menuItems.length} menu items for ${AKSELI_RESTAURANT_NAME} on ${targetDate}`,
  );

  return menuItems;
}
