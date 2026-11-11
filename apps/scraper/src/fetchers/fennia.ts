import * as cheerio from "cheerio";

import type { ParsedMenuItem } from "@acme/shared-types";

import { getHelsinkiDateString } from "./intra.js";

export const FENNIA_RESTAURANT_ID = "fennia";
export const FENNIA_RESTAURANT_NAME = "Ninan Keittiö Fennia";
export const FENNIA_DEFAULT_URL =
  "https://www.ninankeittio.fi/helsinki-pasila-fennia/#lounaslista";

/**
 * Menu groups that are not lunch: the breakfast porridge bar is served before
 * lunch and is left out, like at Akseli.
 */
const FENNIA_SKIPPED_GROUP_REGEX = /^(puurobaari|aamupuuro)/i;

/**
 * A clock time in a staff note typed into a dish slot, e.g. the shortened
 * lunch notice "LOUNASTA KLO.10.30-12.00". Dish names never carry one.
 */
const FENNIA_NOTICE_TIME_REGEX = /\bklo\b\.?\s*\d{1,2}[.:]\d{2}/i;

/**
 * Parses the Ninan Keittiö "poweresta" menu widget for the target date.
 *
 * The widget renders one `div.menu-day` per weekday, each holding a Finnish
 * and an English copy of the menu. A day button carries the ISO date and
 * points at its day container through `aria-controls`.
 *
 * On exceptional days the staff type a note (shortened lunch hours) as the
 * first option of several groups. Such a note has no dietary flags and names a
 * clock time; it is kept once, at the top of the day's items.
 */
export function parseFenniaHtml(
  htmlText: string,
  targetDate: string = getHelsinkiDateString(),
): ParsedMenuItem[] {
  if (!htmlText) return [];

  const $ = cheerio.load(htmlText);
  const dayId = $(`button[data-date="${targetDate}"]`)
    .first()
    .attr("aria-controls");

  const notices: ParsedMenuItem[] = [];
  const dishes: ParsedMenuItem[] = [];

  if (dayId) {
    const $content = $(`[id="${dayId}"] .menu-content[data-lang="fi"]`);

    $content.find(".menu-group").each((_, group) => {
      const $group = $(group);
      const groupName = $group.find("h4").first().text().trim();
      if (FENNIA_SKIPPED_GROUP_REGEX.test(groupName)) return;

      $group.find(".menu-options p").each((_, option) => {
        const $option = $(option);
        const dietaryFlags = $option
          .find(".diet")
          .map((_, diet) => $(diet).attr("data-diet")?.trim() ?? "")
          .get()
          .filter(Boolean);

        // Drop the flag badges (and their hover labels) to keep the dish name
        $option.find(".diet").remove();
        const item = $option.text().replace(/\s+/g, " ").trim();
        if (!item) return;

        if (dietaryFlags.length === 0 && FENNIA_NOTICE_TIME_REGEX.test(item)) {
          if (!notices.some((notice) => notice.item === item)) {
            notices.push({ date: targetDate, item, dietaryFlags });
          }
          return;
        }

        dishes.push({ date: targetDate, item, dietaryFlags });
      });
    });
  }

  const results = [...notices, ...dishes];

  if (results.length === 0) {
    console.log(
      `[${FENNIA_RESTAURANT_NAME}] No menu entry found for ${FENNIA_RESTAURANT_NAME} on date ${targetDate}`,
    );
  }

  return results;
}

/**
 * Fetches and parses menu items for Ninan Keittiö Fennia from its website.
 */
export async function fetchFenniaMenu(
  targetDate: string = getHelsinkiDateString(),
  url: string = process.env.FENNIA_URL ?? FENNIA_DEFAULT_URL,
): Promise<ParsedMenuItem[]> {
  const targetUrl = url.replace(/^["']|["']$/g, "").trim();
  console.log(
    `[${FENNIA_RESTAURANT_NAME}] Fetching menu for date ${targetDate} from website (${targetUrl})...`,
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
      `[${FENNIA_RESTAURANT_NAME}] Website request failed with status ${response.status}: ${await response.text()}`,
    );
  }

  const menuItems = parseFenniaHtml(await response.text(), targetDate);

  console.log(
    `[${FENNIA_RESTAURANT_NAME}] Successfully fetched ${menuItems.length} menu items for ${FENNIA_RESTAURANT_NAME} on ${targetDate}`,
  );

  return menuItems;
}
