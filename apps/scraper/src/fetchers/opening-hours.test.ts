import { describe, expect, it } from "vitest";

import {
  normalizeTimeRange,
  parseAkseliOpeningHours,
  parseDylanBoleOpeningHours,
  parseDylanLaIlmaOpeningHours,
  parseDylanLuftOpeningHours,
  parseHuoltamoOpeningHours,
  parseIsoPajaOpeningHours,
  parsePaattariOpeningHours,
  parsePasilanLinkkiOpeningHours,
  parsePiccoloOpeningHours,
  parseStudio10OpeningHours,
} from "./opening-hours.js";

describe("opening-hours fetcher", () => {
  it("normalizeTimeRange normalizes dashes, spaces, and colons", () => {
    expect(normalizeTimeRange("10:30 - 14:00")).toBe("10.30–14.00");
    expect(normalizeTimeRange("8:00 – 14:00")).toBe("8.00–14.00");
    expect(normalizeTimeRange("10.30-17.30")).toBe("10.30–17.30");
  });

  it("parseHuoltamoOpeningHours extracts correct times from API response", () => {
    const sample = {
      id: "id-c93fsacrg4",
      name: "Ravintola Huoltamo Palmia",
      description:
        "Ravintola Huoltamossa tarjolla\nlounasta ma - pe 10.30 - 17.30\nla - su 12.00 - 17.30",
    };
    const parsed = parseHuoltamoOpeningHours(sample);
    expect(parsed.restaurantId).toBe("huoltamo");
    expect(parsed.restaurantName).toBe("Huoltamo");
    expect(parsed.lunchHours).toBe("Ma–pe 10.30–17.30, la–su 12.00–17.30");
  });

  it("parsePiccoloOpeningHours extracts correct times from API response", () => {
    const sample = {
      id: "id-akwa139wa",
      name: "Piccolo",
      description:
        "Kahvila Piccolo avoinna itsepalvelukahvilana 24h/7\nTarjolla salaatti- ja keittolounasta ma-pe klo 11-13.30 Tervetuloa lounaalle!",
    };
    const parsed = parsePiccoloOpeningHours(sample);
    expect(parsed.restaurantId).toBe("piccolo");
    expect(parsed.restaurantName).toBe("Piccolo");
    expect(parsed.openHours).toBe("24/7 (Itsepalvelu)");
    expect(parsed.lunchHours).toBe("Ma–pe 11.00–13.30");
  });

  it("parseStudio10OpeningHours extracts times from Nordrest HTML", () => {
    const html = `
      <h5>Aukioloajat:</h5>
      <p>Ma-pe klo 10.45-14.00</p>
    `;
    const parsed = parseStudio10OpeningHours(html);
    expect(parsed.restaurantId).toBe("studio-10");
    expect(parsed.lunchHours).toBe("Ma–pe 10.45–14.00");
  });

  it("parseIsoPajaOpeningHours extracts lunch and cafe hours from HTML", () => {
    const html = `
      <p>Lounas ma-pe 10.30-13.30</p>
      <p>Radio Cafe Avoinna: Ma - Pe 7.00-17.00</p>
    `;
    const parsed = parseIsoPajaOpeningHours(html);
    expect(parsed.restaurantId).toBe("iso-paja");
    expect(parsed.lunchHours).toBe("Ma–pe 10.30–13.30");
    expect(parsed.openHours).toBe("Ma–pe 7.00–17.00");
  });

  it("parsePasilanLinkkiOpeningHours extracts lunch hours from Compass Group HTML", () => {
    const html = `
      <p>Lounas tarjolla 10.30–13.00</p>
    `;
    const parsed = parsePasilanLinkkiOpeningHours(html);
    expect(parsed.restaurantId).toBe("pasilan-linkki");
    expect(parsed.lunchHours).toBe("Ma–pe 10.30–13.00");
  });

  it("parsePaattariOpeningHours extracts hours from Nordrest HTML", () => {
    const html = `
      <p>Aukioloajat 8:00 – 14:00</p>
    `;
    const parsed = parsePaattariOpeningHours(html);
    expect(parsed.restaurantId).toBe("paattari");
    expect(parsed.lunchHours).toBe("Ma–pe 8.00–14.00");
  });

  it("parseAkseliOpeningHours extracts lunch and cafe hours from Ninan Keittio HTML", () => {
    const html = `
      <div>Palvelemme ma-pe klo 8-14.00 Kahvila 8-14.00 Aamupuuro klo 7.30-9.00 Lounas 10.30-13.30</div>
    `;
    const parsed = parseAkseliOpeningHours(html);
    expect(parsed.restaurantId).toBe("akseli");
    expect(parsed.lunchHours).toBe("Ma–pe 10.30–13.30");
    expect(parsed.openHours).toBe("Ma–pe 8.00–14.00");
  });

  it("parseDylanLuftOpeningHours extracts lunch and cafe hours from HTML", () => {
    const html = `
      <section>
        <span>AUKIOLOAJAT</span>
        <span>MA-PE klo 8:00-14:00</span>
        <span>klo 10:30-14:00</span>
      </section>
    `;
    const parsed = parseDylanLuftOpeningHours(html);
    expect(parsed.restaurantId).toBe("dylan-luft");
    expect(parsed.lunchHours).toBe("Ma–pe 10.30–14.00");
    expect(parsed.openHours).toBe("Ma–pe 8.00–14.00");
  });

  it("parseDylanBoleOpeningHours extracts lunch and cafe hours from HTML", () => {
    const html = `
      <section>
        <span>AUKIOLOAJAT</span>
        <span>MA-PE Lounas klo 10.30-14.00</span>
        <p>Kahvia ja muita pieniä herkkuja on saatavilla klo 8:00 - 15.45 asti.</p>
      </section>
    `;
    const parsed = parseDylanBoleOpeningHours(html);
    expect(parsed.restaurantId).toBe("dylan-bole");
    expect(parsed.lunchHours).toBe("Ma–pe 10.30–14.00");
    expect(parsed.openHours).toBe("Ma–pe 8.00–15.45");
  });

  it("parseDylanLaIlmaOpeningHours extracts lunch and open hours from HTML", () => {
    const html = `
      <div>
        <p>AUKIOLOAJAT</p>
        <p>MA-PE klo 8:00-14:00</p>
        <p>MA-PE Lounas klo 10:30-14:00</p>
      </div>
    `;
    const parsed = parseDylanLaIlmaOpeningHours(html);
    expect(parsed.restaurantId).toBe("dylan-la-ilma");
    expect(parsed.restaurantName).toBe("Dylan La Ilma");
    expect(parsed.lunchHours).toBe("Ma–pe 10.30–14.00");
    expect(parsed.openHours).toBe("Ma–pe 8.00–14.00");
  });
});
