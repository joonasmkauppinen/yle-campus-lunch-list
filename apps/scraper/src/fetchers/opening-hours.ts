import * as cheerio from "cheerio";

import type { RestaurantOpeningHours } from "@acme/shared-types";

export const HUOLTAMO_OPENING_HOURS_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRFOjE1XNVi19GXHWcA2Q80ALK7ZW8yeYkDFuZWhM9tuMdKzCclmv3P0b5RqwqRED_hmWk5lX98-yLmRnHqstRDJgtUvRR6LGQUXS7pcpPeDgW4iRlzpw1j9qDMp2Dd_U7xDCG7vKkyKMLYKndlAq5ey6GipYzbmsP7T133ExItD0SVoGnRSeimAxJ3Z58QbmD8QEGE8KWCePJF7s8UuqCPSs8Y-KY3uY1ARfIwBMAPEW9S43HO6x038xlxZjLDQFNEQ-BKrHAC6xHs4ik0UXecsHRe9vdf7yRwh6pQwbNYHgH0288&lib=Mj9QMBIRZJsNk6tjp-CZc2vk6ee82Q7eC";

export const PICCOLO_OPENING_HOURS_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRtYU3VwKkny8DUCKLSCnn5O2vcDrR_LDhVR6IiumbpCi-961MUyD2PLwnt8eAicBBGhBTTK9gMgttrqNaY1riqMTaKY6Q6n1vJIX1vKDsxOdoBmi7XZbDIibDN3gc1XhKRIAtZXAraKbERFaKWd5rOiV-36vrXeAub2sGYWfigDlL9Gp2CBXNlDQYLIjj6fv9E6EzcCiCTalgVkmiJd-NrTsDp_85XuNWT5n1M4PVAdc6fKPRd-yHiZmgyoyaHagztS2MwIYyo5KI0IY9R9bEdOca4B1Mp5C24GIrfynQL2GRFjOU&lib=Mj9QMBIRZJsNk6tjp-CZc2vk6ee82Q7eC";

export interface RawScriptResponse {
  id?: string;
  name?: string;
  openHours?: string;
  description?: string;
  contact?: string;
}

/**
 * Standardizes time ranges (e.g. 10.30 - 13.30 or 10:30-13:30 to 10.30–13.30).
 */
export function normalizeTimeRange(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/(?<!\d)(\d{1,2}):(\d{2})/g, "$1.$2")
    .replace(/(?<![.:\d])(\d{1,2})(?=\s*[-–—]|\s*$)/g, "$1.00")
    .replace(/\s*[-–—]\s*/g, "–")
    .trim();
}

/**
 * Parses Huoltamo opening and lunch hours from the Google Apps Script JSON endpoint.
 */
export function parseHuoltamoOpeningHours(
  data: RawScriptResponse,
): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let lunchHours = "Ma–pe 10.30–17.30, la–su 12.00–17.30";
  let openHours = "Ma–pe 10.30–17.30, la–su 12.00–17.30";

  if (data.description) {
    const maPeMatch =
      /ma\s*[-–]\s*pe\s*(\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
        data.description,
      );
    const laSuMatch =
      /la\s*[-–]\s*su\s*(\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
        data.description,
      );
    if (maPeMatch?.[1] && laSuMatch?.[1]) {
      lunchHours = `Ma–pe ${normalizeTimeRange(maPeMatch[1])}, la–su ${normalizeTimeRange(laSuMatch[1])}`;
      openHours = lunchHours;
    }
  }

  return {
    restaurantId: "huoltamo",
    restaurantName: "Huoltamo",
    openHours,
    lunchHours,
    rawText: data.description ?? "",
    lastUpdated,
  };
}

/**
 * Parses Piccolo opening and lunch hours from the Google Apps Script JSON endpoint.
 */
export function parsePiccoloOpeningHours(
  data: RawScriptResponse,
): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let openHours = "24/7 (Itsepalvelu)";
  let lunchHours = "Ma–pe 11.00–13.30";

  if (data.description) {
    const lunchMatch =
      /ma\s*[-–]\s*pe\s*(?:klo\s*)?(\d{1,2}(?:[.:]\d{2})?\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
        data.description,
      );
    if (lunchMatch?.[1]) {
      lunchHours = `Ma–pe ${normalizeTimeRange(lunchMatch[1])}`;
    }
    if (/24h/i.test(data.description)) {
      openHours = "24/7 (Itsepalvelu)";
    }
  }

  return {
    restaurantId: "piccolo",
    restaurantName: "Piccolo",
    openHours,
    lunchHours,
    rawText: data.description ?? "",
    lastUpdated,
  };
}

/**
 * Parses Studio 10 opening hours from Nordrest HTML page.
 */
export function parseStudio10OpeningHours(
  html: string,
): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let lunchHours = "Ma–pe 10.45–14.00";
  let openHours = "Ma–pe 10.45–14.00";

  if (html) {
    const $ = cheerio.load(html);
    const text = $("h5:contains('Aukioloajat') + p, p:contains('Ma-pe klo')")
      .first()
      .text()
      .trim();
    if (text) {
      const match =
        /(?:ma\s*[-–]\s*pe)?\s*(?:klo\s*)?(\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
          text,
        );
      if (match?.[1]) {
        lunchHours = `Ma–pe ${normalizeTimeRange(match[1])}`;
        openHours = lunchHours;
      }
    }
  }

  return {
    restaurantId: "studio-10",
    restaurantName: "Studio 10",
    openHours,
    lunchHours,
    rawText: "Ma-pe klo 10.45-14.00",
    lastUpdated,
  };
}

/**
 * Parses Iso Paja opening and lunch hours from HH-ravintolat HTML page.
 */
export function parseIsoPajaOpeningHours(html: string): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let lunchHours = "Ma–pe 10.30–13.30";
  let openHours = "Ma–pe 7.00–17.00";

  if (html) {
    const $ = cheerio.load(html);
    const lunchText = $("p:contains('Lounas ma-pe')").text();
    const openText = $(
      "p:contains('Avoinna:'), div:contains('Avoinna:')",
    ).text();

    const lunchMatch =
      /lounas\s*ma\s*[-–]\s*pe\s*(\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
        lunchText,
      );
    if (lunchMatch?.[1]) {
      lunchHours = `Ma–pe ${normalizeTimeRange(lunchMatch[1])}`;
    }

    const openMatch =
      /ma\s*[-–]\s*pe\s*(\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
        openText,
      );
    if (openMatch?.[1]) {
      openHours = `Ma–pe ${normalizeTimeRange(openMatch[1])}`;
    }
  }

  return {
    restaurantId: "iso-paja",
    restaurantName: "Iso Paja",
    openHours,
    lunchHours,
    rawText: `Lounas: ${lunchHours}, Kahvila: ${openHours}`,
    lastUpdated,
  };
}

/**
 * Parses Pasilan Linkki opening and lunch hours from Compass Group page.
 */
export function parsePasilanLinkkiOpeningHours(
  html: string,
): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let lunchHours = "Ma–pe 10.30–13.00";
  let openHours = "Ma–pe 10.30–13.00";

  if (html) {
    const $ = cheerio.load(html);
    const text = $(
      "p:contains('Lounas tarjolla'), p:contains('Lounas')",
    ).text();
    const match =
      /(?:lounas\s*tarjolla)?\s*(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2})/i.exec(
        text,
      );
    if (match?.[1]) {
      lunchHours = `Ma–pe ${normalizeTimeRange(match[1])}`;
      openHours = lunchHours;
    }
  }

  return {
    restaurantId: "pasilan-linkki",
    restaurantName: "Pasilan Linkki",
    openHours,
    lunchHours,
    rawText: lunchHours,
    lastUpdated,
  };
}

/**
 * Parses Päättäri opening hours from Nordrest HTML page.
 */
export function parsePaattariOpeningHours(
  html: string,
): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let lunchHours = "Ma–pe 8.00–14.00";
  let openHours = "Ma–pe 8.00–14.00";

  if (html) {
    const $ = cheerio.load(html);
    const text = $("p:contains('Aukioloajat')").text();
    const match = /(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2})/.exec(text);
    if (match?.[1]) {
      lunchHours = `Ma–pe ${normalizeTimeRange(match[1])}`;
      openHours = lunchHours;
    }
  }

  return {
    restaurantId: "paattari",
    restaurantName: "Päättäri",
    openHours,
    lunchHours,
    rawText: openHours,
    lastUpdated,
  };
}

/**
 * Parses Akseli opening and lunch hours from Ninan Keittiö HTML page.
 */
export function parseAkseliOpeningHours(html: string): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let lunchHours = "Ma–pe 10.30–13.30";
  let openHours = "Ma–pe 8.00–14.00";

  if (html) {
    const $ = cheerio.load(html);
    const text = $("div:contains('Palvelemme ma-pe'), p:contains('Palvelemme')")
      .first()
      .text();
    const openMatch =
      /kahvila\s*(\d{1,2}(?:[.:]\d{2})?\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(text);
    if (openMatch?.[1]) {
      openHours = `Ma–pe ${normalizeTimeRange(openMatch[1])}`;
    }
    const lunchMatch =
      /lounas\s*(\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(text);
    if (lunchMatch?.[1]) {
      lunchHours = `Ma–pe ${normalizeTimeRange(lunchMatch[1])}`;
    }
  }

  return {
    restaurantId: "akseli",
    restaurantName: "Akseli",
    openHours,
    lunchHours,
    rawText: `Kahvila ${openHours}, Lounas ${lunchHours}`,
    lastUpdated,
  };
}

/**
 * Parses Dylan Luft opening and lunch hours from Dylan website.
 */
export function parseDylanLuftOpeningHours(
  html: string,
): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let lunchHours = "Ma–pe 10.30–14.00";
  let openHours = "Ma–pe 8.00–14.00";

  if (html) {
    const $ = cheerio.load(html);
    const text = $(
      "section:contains('AUKIOLOAJAT'), div:contains('AUKIOLOAJAT')",
    )
      .text()
      .replace(/\s+/g, " ");
    const openMatch =
      /MA\s*[-–]\s*PE\s*(?:klo\s*)?(\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
        text,
      );
    if (openMatch?.[1]) {
      openHours = `Ma–pe ${normalizeTimeRange(openMatch[1])}`;
    }
    const lunchMatch = /(?:lounas\s*)?klo\s*(10[.:]30\s*[-–]\s*14[.:]00)/i.exec(
      text,
    );
    if (lunchMatch?.[1]) {
      lunchHours = `Ma–pe ${normalizeTimeRange(lunchMatch[1])}`;
    }
  }

  return {
    restaurantId: "dylan-luft",
    restaurantName: "Dylan Luft",
    openHours,
    lunchHours,
    rawText: `Avoinna ${openHours}, Lounas ${lunchHours}`,
    lastUpdated,
  };
}

/**
 * Parses Dylan Böle opening and lunch hours from Dylan website.
 */
export function parseDylanBoleOpeningHours(
  html: string,
): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let lunchHours = "Ma–pe 10.30–14.00";
  let openHours = "Ma–pe 8.00–15.45";

  if (html) {
    const $ = cheerio.load(html);
    const text = $(
      "section:contains('AUKIOLOAJAT'), div:contains('AUKIOLOAJAT'), body",
    )
      .text()
      .replace(/\s+/g, " ");
    const lunchMatch =
      /MA\s*[-–]\s*PE\s*Lounas\s*(?:klo\s*)?(\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
        text,
      );
    if (lunchMatch?.[1]) {
      lunchHours = `Ma–pe ${normalizeTimeRange(lunchMatch[1])}`;
    }
    const cafeMatch =
      /(?:aulakahvila|kahvia|kahvila)[^.]*?klo\s*(\d{1,2}(?:[.:]\d{2})?\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
        text,
      );
    if (cafeMatch?.[1]) {
      openHours = `Ma–pe ${normalizeTimeRange(cafeMatch[1])}`;
    }
  }

  return {
    restaurantId: "dylan-bole",
    restaurantName: "Dylan Böle",
    openHours,
    lunchHours,
    rawText: `Lounas ${lunchHours}, Kahvila ${openHours}`,
    lastUpdated,
  };
}

/**
 * Parses Dylan La Ilma opening and lunch hours from Dylan website.
 */
export function parseDylanLaIlmaOpeningHours(
  html: string,
): RestaurantOpeningHours {
  const lastUpdated = new Date().toISOString();
  let lunchHours = "Ma–pe 10.30–14.00";
  let openHours = "Ma–pe 8.00–14.00";

  if (html) {
    const $ = cheerio.load(html);
    const text = $(
      "section:contains('AUKIOLOAJAT'), div:contains('AUKIOLOAJAT'), body",
    )
      .text()
      .replace(/\s+/g, " ");
    const openMatch =
      /MA\s*[-–]\s*PE\s*(?:klo\s*)?(\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2})/i.exec(
        text,
      );
    if (openMatch?.[1]) {
      openHours = `Ma–pe ${normalizeTimeRange(openMatch[1])}`;
    }
    const lunchMatch =
      /(?:lounas\s*(?:klo\s*)?|klo\s*)(10[.:]30\s*[-–]\s*14[.:]00)/i.exec(text);
    if (lunchMatch?.[1]) {
      lunchHours = `Ma–pe ${normalizeTimeRange(lunchMatch[1])}`;
    }
  }

  return {
    restaurantId: "dylan-la-ilma",
    restaurantName: "Dylan La Ilma",
    openHours,
    lunchHours,
    rawText: `Avoinna ${openHours}, Lounas ${lunchHours}`,
    lastUpdated,
  };
}

/**
 * Fetches all restaurant opening hours across endpoints and websites.
 */
export async function fetchAllOpeningHours(): Promise<
  RestaurantOpeningHours[]
> {
  console.log("\n=== Fetching Opening Hours for All Restaurants ===");
  const results: RestaurantOpeningHours[] = [];

  // 1. Huoltamo (Custom Google Apps Script URL)
  try {
    const huoltamoUrl =
      process.env.HUOLTAMO_OPENING_HOURS_URL ?? HUOLTAMO_OPENING_HOURS_URL;
    const res = await fetch(huoltamoUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const json = (await res.json()) as RawScriptResponse;
      results.push(parseHuoltamoOpeningHours(json));
      console.log(`[Opening Hours] Fetched Huoltamo`);
    } else {
      results.push(parseHuoltamoOpeningHours({}));
    }
  } catch (err) {
    console.error("[Opening Hours] Error fetching Huoltamo:", err);
    results.push(parseHuoltamoOpeningHours({}));
  }

  // 2. Piccolo (Custom Google Apps Script URL)
  try {
    const piccoloUrl =
      process.env.PICCOLO_OPENING_HOURS_URL ?? PICCOLO_OPENING_HOURS_URL;
    const res = await fetch(piccoloUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const json = (await res.json()) as RawScriptResponse;
      results.push(parsePiccoloOpeningHours(json));
      console.log(`[Opening Hours] Fetched Piccolo`);
    } else {
      results.push(parsePiccoloOpeningHours({}));
    }
  } catch (err) {
    console.error("[Opening Hours] Error fetching Piccolo:", err);
    results.push(parsePiccoloOpeningHours({}));
  }

  // 3. Studio 10 (Nordrest website)
  try {
    const url = "https://nordrest.fi/restaurang/yle-studio10/";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    const html = res.ok ? await res.text() : "";
    results.push(parseStudio10OpeningHours(html));
    console.log(`[Opening Hours] Fetched Studio 10`);
  } catch (err) {
    console.error("[Opening Hours] Error fetching Studio 10:", err);
    results.push(parseStudio10OpeningHours(""));
  }

  // 4. Iso Paja (Website)
  try {
    const url =
      process.env.ISO_PAJA_URL ?? "https://www.hhravintolat.fi/iso-paja/";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    const html = res.ok ? await res.text() : "";
    results.push(parseIsoPajaOpeningHours(html));
    console.log(`[Opening Hours] Fetched Iso Paja`);
  } catch (err) {
    console.error("[Opening Hours] Error fetching Iso Paja:", err);
    results.push(parseIsoPajaOpeningHours(""));
  }

  // 5. Pasilan Linkki (Website)
  try {
    const url =
      process.env.PASILAN_LINKKI_URL ??
      "https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    const html = res.ok ? await res.text() : "";
    results.push(parsePasilanLinkkiOpeningHours(html));
    console.log(`[Opening Hours] Fetched Pasilan Linkki`);
  } catch (err) {
    console.error("[Opening Hours] Error fetching Pasilan Linkki:", err);
    results.push(parsePasilanLinkkiOpeningHours(""));
  }

  // 6. Päättäri (Website)
  try {
    const url =
      process.env.PAATTARI_URL ??
      "https://nordrest.fi/restaurang/ravintola-paattari/";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    const html = res.ok ? await res.text() : "";
    results.push(parsePaattariOpeningHours(html));
    console.log(`[Opening Hours] Fetched Päättäri`);
  } catch (err) {
    console.error("[Opening Hours] Error fetching Päättäri:", err);
    results.push(parsePaattariOpeningHours(""));
  }

  // 7. Akseli (Website)
  try {
    const url =
      process.env.AKSELI_URL ??
      "https://www.ninankeittio.fi/helsinki-ilmala-akseli/";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    const html = res.ok ? await res.text() : "";
    results.push(parseAkseliOpeningHours(html));
    console.log(`[Opening Hours] Fetched Akseli`);
  } catch (err) {
    console.error("[Opening Hours] Error fetching Akseli:", err);
    results.push(parseAkseliOpeningHours(""));
  }

  // 8. Dylan Luft (Website)
  try {
    const url = "https://www.dylan.fi/luft";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    const html = res.ok ? await res.text() : "";
    results.push(parseDylanLuftOpeningHours(html));
    console.log(`[Opening Hours] Fetched Dylan Luft`);
  } catch (err) {
    console.error("[Opening Hours] Error fetching Dylan Luft:", err);
    results.push(parseDylanLuftOpeningHours(""));
  }

  // 9. Dylan Böle (Website)
  try {
    const url = "https://www.dylan.fi/bole";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    const html = res.ok ? await res.text() : "";
    results.push(parseDylanBoleOpeningHours(html));
    console.log(`[Opening Hours] Fetched Dylan Böle`);
  } catch (err) {
    console.error("[Opening Hours] Error fetching Dylan Böle:", err);
    results.push(parseDylanBoleOpeningHours(""));
  }

  // 10. Dylan La Ilma (Website)
  try {
    const url = "https://www.dylan.fi/lailma";
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    const html = res.ok ? await res.text() : "";
    results.push(parseDylanLaIlmaOpeningHours(html));
    console.log(`[Opening Hours] Fetched Dylan La Ilma`);
  } catch (err) {
    console.error("[Opening Hours] Error fetching Dylan La Ilma:", err);
    results.push(parseDylanLaIlmaOpeningHours(""));
  }

  return results;
}
