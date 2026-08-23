import "./env.js";

import { fileURLToPath } from "node:url";

import {
  AKSELI_RESTAURANT_ID,
  AKSELI_RESTAURANT_NAME,
  fetchAkseliMenu,
} from "./fetchers/akseli.js";
import {
  DYLAN_BOLE_RESTAURANT_ID,
  DYLAN_BOLE_RESTAURANT_NAME,
  fetchDylanBoleMenu,
} from "./fetchers/dylan-bole.js";
import {
  DYLAN_LUFT_RESTAURANT_ID,
  DYLAN_LUFT_RESTAURANT_NAME,
  fetchDylanLuftMenu,
} from "./fetchers/dylan-luft.js";
import {
  fetchIntraMenus,
  getHelsinkiDateString,
  INTRA_RESTAURANTS,
} from "./fetchers/intra.js";
import {
  fetchIsoPajaMenu,
  ISO_PAJA_RESTAURANT_ID,
  ISO_PAJA_RESTAURANT_NAME,
} from "./fetchers/iso-paja.js";
import { fetchAllOpeningHours } from "./fetchers/opening-hours.js";
import {
  fetchPaattariMenu,
  PAATTARI_RESTAURANT_ID,
  PAATTARI_RESTAURANT_NAME,
} from "./fetchers/paattari.js";
import {
  fetchPasilanLinkkiMenu,
  PASILAN_LINKKI_RESTAURANT_ID,
  PASILAN_LINKKI_RESTAURANT_NAME,
} from "./fetchers/pasilan-linkki.js";
import { updateGoogleSheet, updateGoogleSheetOpeningHours } from "./sheets.js";

/**
 * Resolves the target scraping date (YYYY-MM-DD) from CLI flags, env variables, or today in Europe/Helsinki.
 *
 * Supported formats:
 * - CLI flags: --date 2026-08-21, --date=2026-08-21, -d 2026-08-21, -d=2026-08-21
 * - Positional argument: 2026-08-21
 * - Environment variables: TARGET_DATE, DATE, SCRAPE_DATE
 */
export function resolveTargetDate(
  argv: string[] = process.argv.slice(2),
): string {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--date" || arg === "-d") {
      const next = argv[i + 1];
      if (next && /^\d{4}-\d{2}-\d{2}$/.test(next)) {
        return next;
      }
    }
    if (arg.startsWith("--date=") || arg.startsWith("-d=")) {
      const val = arg.split("=")[1];
      if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return val;
      }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
      return arg;
    }
  }

  const envDate =
    process.env.TARGET_DATE ?? process.env.DATE ?? process.env.SCRAPE_DATE;

  if (envDate && /^\d{4}-\d{2}-\d{2}$/.test(envDate.trim())) {
    return envDate.trim();
  }

  return getHelsinkiDateString();
}

async function main() {
  const targetDate = resolveTargetDate();
  console.log(
    `=== Campus Lunch List Scraper Starting (Target Date: ${targetDate}) ===`,
  );

  // 1. Intra Restaurants: Huoltamo, Studio 10, Piccolo (JSON API)
  console.log(
    "\nProcessing target: Intra Restaurants (Huoltamo, Studio 10, Piccolo)",
  );
  try {
    const intraMenus = await fetchIntraMenus(targetDate);
    for (const restaurant of INTRA_RESTAURANTS) {
      const menus = intraMenus[restaurant.id];
      await updateGoogleSheet(
        restaurant.id,
        restaurant.name,
        menus,
        targetDate,
      );
      console.log(
        `Successfully completed scraping for ${restaurant.name} (${restaurant.id})`,
      );
    }
  } catch (error) {
    console.error("Error processing Intra Restaurants:", error);
  }

  // 2. Dylan Luft (RSS Feed)
  console.log("\nProcessing target: Dylan Luft (RSS Feed)");
  try {
    const dylanLuftMenus = await fetchDylanLuftMenu(targetDate);
    await updateGoogleSheet(
      DYLAN_LUFT_RESTAURANT_ID,
      DYLAN_LUFT_RESTAURANT_NAME,
      dylanLuftMenus,
      targetDate,
    );
    console.log(
      `Successfully completed scraping for ${DYLAN_LUFT_RESTAURANT_NAME} (${DYLAN_LUFT_RESTAURANT_ID})`,
    );
  } catch (error) {
    console.error("Error processing Dylan Luft:", error);
  }

  // 3. Dylan Böle (RSS Feed)
  console.log("\nProcessing target: Dylan Böle (RSS Feed)");
  try {
    const dylanBoleMenus = await fetchDylanBoleMenu(targetDate);
    await updateGoogleSheet(
      DYLAN_BOLE_RESTAURANT_ID,
      DYLAN_BOLE_RESTAURANT_NAME,
      dylanBoleMenus,
      targetDate,
    );
    console.log(
      `Successfully completed scraping for ${DYLAN_BOLE_RESTAURANT_NAME} (${DYLAN_BOLE_RESTAURANT_ID})`,
    );
  } catch (error) {
    console.error("Error processing Dylan Böle:", error);
  }

  // 4. Pasilan Linkki (RSS Feed)
  console.log("\nProcessing target: Pasilan Linkki (RSS Feed)");
  try {
    const linkkiMenus = await fetchPasilanLinkkiMenu(targetDate);
    await updateGoogleSheet(
      PASILAN_LINKKI_RESTAURANT_ID,
      PASILAN_LINKKI_RESTAURANT_NAME,
      linkkiMenus,
      targetDate,
    );
    console.log(
      `Successfully completed scraping for ${PASILAN_LINKKI_RESTAURANT_NAME} (${PASILAN_LINKKI_RESTAURANT_ID})`,
    );
  } catch (error) {
    console.error("Error processing Pasilan Linkki:", error);
  }

  // 5. Iso Paja (Website Cheerio)
  console.log("\nProcessing target: Iso Paja (Website Cheerio)");
  try {
    const isoPajaMenus = await fetchIsoPajaMenu(targetDate);
    await updateGoogleSheet(
      ISO_PAJA_RESTAURANT_ID,
      ISO_PAJA_RESTAURANT_NAME,
      isoPajaMenus,
      targetDate,
    );
    console.log(
      `Successfully completed scraping for ${ISO_PAJA_RESTAURANT_NAME} (${ISO_PAJA_RESTAURANT_ID})`,
    );
  } catch (error) {
    console.error("Error processing Iso Paja:", error);
  }

  // 6. Akseli (Website Cheerio)
  console.log("\nProcessing target: Akseli (Website Cheerio)");
  try {
    const akseliMenus = await fetchAkseliMenu(targetDate);
    await updateGoogleSheet(
      AKSELI_RESTAURANT_ID,
      AKSELI_RESTAURANT_NAME,
      akseliMenus,
      targetDate,
    );
    console.log(
      `Successfully completed scraping for ${AKSELI_RESTAURANT_NAME} (${AKSELI_RESTAURANT_ID})`,
    );
  } catch (error) {
    console.error("Error processing Akseli:", error);
  }

  // 7. Päättäri (Website Cheerio)
  console.log("\nProcessing target: Päättäri (Website Cheerio)");
  try {
    const paattariMenus = await fetchPaattariMenu(targetDate);
    await updateGoogleSheet(
      PAATTARI_RESTAURANT_ID,
      PAATTARI_RESTAURANT_NAME,
      paattariMenus,
      targetDate,
    );
    console.log(
      `Successfully completed scraping for ${PAATTARI_RESTAURANT_NAME} (${PAATTARI_RESTAURANT_ID})`,
    );
  } catch (error) {
    console.error("Error processing Päättäri:", error);
  }

  // 8. Opening Hours (All restaurants)
  console.log("\nProcessing target: Restaurant Opening Hours");
  try {
    const openingHours = await fetchAllOpeningHours();
    await updateGoogleSheetOpeningHours(openingHours);
    console.log(
      `Successfully completed opening hours update for ${openingHours.length} restaurants`,
    );
  } catch (error) {
    console.error("Error processing opening hours:", error);
  }

  console.log("\n=== Campus Lunch List Scraper Finished ===");
}

export { main };

const isMain =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("/index.ts") ||
    process.argv[1].endsWith("/index.js"));

if (isMain) {
  main().catch((err: unknown) => {
    console.error("Fatal error running scraper pipeline:", err);
    process.exit(1);
  });
}
