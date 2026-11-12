import type { ParsedMenuItem } from "@acme/shared-types";
import { getWeekDates } from "@acme/shared-types";
import { AKSELI_DEFAULT_URL, parseAkseliHtml } from "./fetchers/akseli.js";
import {
  DYLAN_LUFT_DEFAULT_RSS_URL,
  parseDylanLuftRss,
} from "./fetchers/dylan-luft.js";
import {
  DYLAN_BOLE_DEFAULT_RSS_URL,
  parseDylanBoleRss,
} from "./fetchers/dylan-bole.js";
import {
  DYLAN_LA_ILMA_DEFAULT_RSS_URL,
  parseDylanLaIlmaRss,
} from "./fetchers/dylan-la-ilma.js";
import { FENNIA_DEFAULT_URL, parseFenniaHtml } from "./fetchers/fennia.js";
import {
  INTRA_DEFAULT_API_URL,
  INTRA_RESTAURANTS,
  parseIntraResponse,
} from "./fetchers/intra.js";
import type { RawApiResponse } from "./fetchers/intra.js";
import { ISO_PAJA_DEFAULT_URL, parseIsoPajaHtml } from "./fetchers/iso-paja.js";
import {
  PAATTARI_DEFAULT_URL,
  parsePaattariHtml,
} from "./fetchers/paattari.js";
import {
  PASILAN_LINKKI_DEFAULT_RSS_URL,
  parsePasilanLinkkiRss,
} from "./fetchers/pasilan-linkki.js";
import { PIANO_DEFAULT_URL, parsePianoHtml } from "./fetchers/piano.js";

export interface Source {
  id: string;
  name: string;
  url: string;
  parse: (body: string, date: string) => ParsedMenuItem[];
}
export interface ScrapedDay {
  date: string;
  state: "published" | "closed" | "unpublished" | "failed";
  items: ParsedMenuItem[];
}

/** Upgrade known daily-feed overrides as well as the checked-in defaults. */
export function weeklyUrl(value: string): string {
  const url = new URL(value.replace(/^["']|["']$/g, "").trim());
  if (url.hostname === "lounastaja.app") url.searchParams.delete("days");
  if (url.hostname.endsWith("compass-group.fi"))
    url.pathname = url.pathname.replace("/current-day", "/current-week");
  return url.toString();
}

export function getSources(): Source[] {
  const env = process.env;
  const intraUrl =
    env.INTRA_API_URL ?? env.HUOLTAMO_API_URL ?? INTRA_DEFAULT_API_URL;
  return [
    ...INTRA_RESTAURANTS.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      url: intraUrl,
      parse: (body: string, date: string) =>
        parseIntraResponse(
          JSON.parse(body) as RawApiResponse,
          restaurant.id,
          date,
        ),
    })),
    {
      id: "dylan-luft",
      name: "Dylan Luft",
      url:
        env.DYLAN_LUFT_RSS_URL ??
        env.DYLAN_LUFT_URL ??
        DYLAN_LUFT_DEFAULT_RSS_URL,
      parse: parseDylanLuftRss,
    },
    {
      id: "dylan-bole",
      name: "Dylan Böle",
      url:
        env.DYLAN_BOLE_RSS_URL ??
        env.DYLAN_BOLE_URL ??
        DYLAN_BOLE_DEFAULT_RSS_URL,
      parse: parseDylanBoleRss,
    },
    {
      id: "dylan-la-ilma",
      name: "Dylan La Ilma",
      url:
        env.DYLAN_LA_ILMA_RSS_URL ??
        env.DYLAN_LA_ILMA_URL ??
        DYLAN_LA_ILMA_DEFAULT_RSS_URL,
      parse: parseDylanLaIlmaRss,
    },
    {
      id: "pasilan-linkki",
      name: "Pasilan Linkki",
      url:
        env.PASILAN_LINKKI_RSS_URL ??
        env.PASILAN_LINKKI_URL ??
        env.LINKKI_RSS_URL ??
        PASILAN_LINKKI_DEFAULT_RSS_URL,
      parse: parsePasilanLinkkiRss,
    },
    {
      id: "iso-paja",
      name: "Iso Paja",
      url: env.ISO_PAJA_URL ?? ISO_PAJA_DEFAULT_URL,
      parse: parseIsoPajaHtml,
    },
    {
      id: "akseli",
      name: "Akseli",
      url: env.AKSELI_URL ?? AKSELI_DEFAULT_URL,
      parse: parseAkseliHtml,
    },
    {
      id: "paattari",
      name: "Päättäri",
      url: env.PAATTARI_URL ?? PAATTARI_DEFAULT_URL,
      parse: parsePaattariHtml,
    },
    {
      id: "fennia",
      name: "Ninan Keittiö Fennia",
      url: env.FENNIA_URL ?? FENNIA_DEFAULT_URL,
      parse: parseFenniaHtml,
    },
    {
      id: "piano",
      name: "Ravintola Piano",
      url: env.PIANO_URL ?? PIANO_DEFAULT_URL,
      parse: parsePianoHtml,
    },
  ];
}

export function parseDays(
  source: Source,
  body: string,
  dates: string[],
): ScrapedDay[] {
  if (!body.trim()) throw new Error("Empty source response");
  const intra = ["huoltamo", "piccolo", "studio-10"].includes(source.id);
  if (intra && !Array.isArray((JSON.parse(body) as RawApiResponse).items))
    throw new Error("Unrecognized Intra response");
  if (
    (source.id.startsWith("dylan-") || source.id === "pasilan-linkki") &&
    !/<rss\b/i.test(body)
  )
    throw new Error("Unrecognized RSS response");
  if (
    !intra &&
    !source.id.startsWith("dylan-") &&
    source.id !== "pasilan-linkki" &&
    !/maanantai|tiistai|keskiviikko|torstai|perjantai|lauantai|sunnuntai|data-date=/i.test(
      body,
    )
  )
    throw new Error("No recognizable menu structure");
  return dates.map((date) => {
    const items = source.parse(body, date);
    const closed =
      items.length > 0 &&
      items.every((item) =>
        /^(?:ravintola\s+)?suljettu[.!]?$/i.test(item.item.trim()),
      );
    return {
      date,
      items: closed ? [] : items,
      state: closed ? "closed" : items.length ? "published" : "unpublished",
    };
  });
}

export function createSourceFetcher() {
  const payloads = new Map<string, Promise<string>>();
  return async (source: Source, dates: string[]): Promise<ScrapedDay[]> => {
    const url = weeklyUrl(source.url);
    let payload = payloads.get(url);
    if (!payload) {
      payload = fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json, application/rss+xml, text/html, */*",
        },
        signal: AbortSignal.timeout(20_000),
      }).then(async (response) => {
        if (!response.ok)
          throw new Error(`Source returned HTTP ${response.status}`);
        return response.text();
      });
      payloads.set(url, payload);
    }
    try {
      return parseDays(source, await payload, dates);
    } catch (error) {
      console.error(
        `[${source.name}] Failed to fetch/parse week:`,
        error instanceof Error ? error.message : "unknown error",
      );
      return dates.map((date) => ({ date, state: "failed", items: [] }));
    }
  };
}

export { getWeekDates };
