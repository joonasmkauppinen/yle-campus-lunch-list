import * as cheerio from "cheerio";

import type { ParsedMenuItem } from "@acme/shared-types";

import { getHelsinkiDateString } from "./intra.js";

export const PIANO_RESTAURANT_ID = "piano";
export const PIANO_RESTAURANT_NAME = "Ravintola Piano";
export const PIANO_DEFAULT_URL = "https://www.ravintolapiano.fi/";

/**
 * A trailing dietary flag token, e.g. "G.M", "L.SG", "L" or "G,L". Piano joins
 * flags with dots; only short uppercase tokens count, so the last word of a
 * dish name is never mistaken for one.
 */
const PIANO_FLAGS_REGEX = /\s+([A-ZÄÖ]{1,3}(?:[.,][A-ZÄÖ]{1,3})*)\.?\s*$/;

/**
 * Splits a Piano menu line into dish name and dietary flags.
 */
export function parsePianoLine(
  rawLine: string,
  targetDate: string,
): ParsedMenuItem | null {
  const cleaned = rawLine.replace(/ /g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const flagMatch = PIANO_FLAGS_REGEX.exec(cleaned);
  const dietaryFlags = flagMatch?.[1] ? flagMatch[1].split(/[.,]/) : [];
  const item = (flagMatch ? cleaned.slice(0, flagMatch.index) : cleaned).trim();

  if (!item) return null;
  return { date: targetDate, item, dietaryFlags };
}

/**
 * Extracts an ISO date from a weekday heading like "Maanantai 9.11". The page
 * prints no year, so it is taken from the target date — except for a heading
 * in December seen from a January target date (and vice versa), which belongs
 * to the neighbouring year.
 */
export function extractPianoHeadingDate(
  headingText: string,
  targetDate: string,
): string | null {
  const match =
    /(?:maanantai|tiistai|keskiviikko|torstai|perjantai|lauantai|sunnuntai)\s+(\d{1,2})\.(\d{1,2})\.?(\d{4})?/i.exec(
      headingText.replace(/ /g, " "),
    );
  if (!match?.[1] || !match[2]) return null;

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  let year = match[3] ? Number(match[3]) : Number(targetDate.slice(0, 4));

  if (!match[3]) {
    const targetMonth = Number(targetDate.slice(5, 7));
    if (month === "12" && targetMonth === 1) year -= 1;
    if (month === "01" && targetMonth === 12) year += 1;
  }

  return `${year}-${month}-${day}`;
}

/**
 * Parses the Ravintola Piano front page for the target date. Each weekday is
 * an `h4` heading followed by a `ul` of dishes.
 */
export function parsePianoHtml(
  htmlText: string,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  if (!htmlText) return [];

  const $ = cheerio.load(htmlText);
  const results: ParsedMenuItem[] = [];

  $("h4").each((_, heading) => {
    const $heading = $(heading);
    if (extractPianoHeadingDate($heading.text(), targetDate) !== targetDate) {
      return;
    }

    $heading
      .nextAll("ul")
      .first()
      .find("li")
      .each((_, li) => {
        const parsed = parsePianoLine($(li).text(), targetDate);
        if (parsed) results.push(parsed);
      });
  });

  if (results.length === 0) {
    console.log(
      `[${PIANO_RESTAURANT_NAME}] No menu entry found for ${PIANO_RESTAURANT_NAME} on date ${targetDate}`,
    );
  }

  return results;
}

/**
 * Fetches and parses menu items for Ravintola Piano from its website.
 */
export async function fetchPianoMenu(
  targetDate: string = getHelsinkiDateString(),
  url: string = process.env.PIANO_URL ?? PIANO_DEFAULT_URL,
): Promise<ParsedMenuItem[]> {
  const targetUrl = url.replace(/^["']|["']$/g, "").trim();
  console.log(
    `[${PIANO_RESTAURANT_NAME}] Fetching menu for date ${targetDate} from website (${targetUrl})...`,
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
      `[${PIANO_RESTAURANT_NAME}] Website request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const menuItems = parsePianoHtml(await response.text(), targetDate);

  console.log(
    `[${PIANO_RESTAURANT_NAME}] Successfully fetched ${menuItems.length} menu items for ${PIANO_RESTAURANT_NAME} on ${targetDate}`,
  );

  return menuItems;
}
