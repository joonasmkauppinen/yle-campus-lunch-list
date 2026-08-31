import assert from "node:assert/strict";
import { describe, it } from "node:test";

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

void describe("opening-hours fetcher", () => {
  void it("normalizeTimeRange normalizes dashes, spaces, and colons", () => {
    assert.equal(normalizeTimeRange("10:30 - 14:00"), "10.30–14.00");
    assert.equal(normalizeTimeRange("8:00 – 14:00"), "8.00–14.00");
    assert.equal(normalizeTimeRange("10.30-17.30"), "10.30–17.30");
  });

  void it("parseHuoltamoOpeningHours extracts correct times from API response", () => {
    const sample = {
      id: "id-c93fsacrg4",
      name: "Ravintola Huoltamo Palmia",
      description:
        "Ravintola Huoltamossa tarjolla\nlounasta ma - pe 10.30 - 17.30\nla - su 12.00 - 17.30",
    };
    const parsed = parseHuoltamoOpeningHours(sample);
    assert.equal(parsed.restaurantId, "huoltamo");
    assert.equal(parsed.restaurantName, "Huoltamo");
    assert.equal(parsed.lunchHours, "Ma–pe 10.30–17.30, la–su 12.00–17.30");
  });

  void it("parsePiccoloOpeningHours extracts correct times from API response", () => {
    const sample = {
      id: "id-akwa139wa",
      name: "Piccolo",
      description:
        "Kahvila Piccolo avoinna itsepalvelukahvilana 24h/7\nTarjolla salaatti- ja keittolounasta ma-pe klo 11-13.30 Tervetuloa lounaalle!",
    };
    const parsed = parsePiccoloOpeningHours(sample);
    assert.equal(parsed.restaurantId, "piccolo");
    assert.equal(parsed.restaurantName, "Piccolo");
    assert.equal(parsed.openHours, "24/7 (Itsepalvelu)");
    assert.equal(parsed.lunchHours, "Ma–pe 11.00–13.30");
  });

  void it("parseStudio10OpeningHours extracts times from Nordrest HTML", () => {
    const html = `
      <h5>Aukioloajat:</h5>
      <p>Ma-pe klo 10.45-14.00</p>
    `;
    const parsed = parseStudio10OpeningHours(html);
    assert.equal(parsed.restaurantId, "studio-10");
    assert.equal(parsed.lunchHours, "Ma–pe 10.45–14.00");
  });

  void it("parseIsoPajaOpeningHours extracts lunch and cafe hours from HTML", () => {
    const html = `
      <p>Lounas ma-pe 10.30-13.30</p>
      <p>Radio Cafe Avoinna: Ma - Pe 7.00-17.00</p>
    `;
    const parsed = parseIsoPajaOpeningHours(html);
    assert.equal(parsed.restaurantId, "iso-paja");
    assert.equal(parsed.lunchHours, "Ma–pe 10.30–13.30");
    assert.equal(parsed.openHours, "Ma–pe 7.00–17.00");
  });

  void it("parsePasilanLinkkiOpeningHours extracts lunch hours from Compass Group HTML", () => {
    const html = `
      <p>Lounas tarjolla 10.30–13.00</p>
    `;
    const parsed = parsePasilanLinkkiOpeningHours(html);
    assert.equal(parsed.restaurantId, "pasilan-linkki");
    assert.equal(parsed.lunchHours, "Ma–pe 10.30–13.00");
  });

  void it("parsePaattariOpeningHours extracts hours from Nordrest HTML", () => {
    const html = `
      <p>Aukioloajat 8:00 – 14:00</p>
    `;
    const parsed = parsePaattariOpeningHours(html);
    assert.equal(parsed.restaurantId, "paattari");
    assert.equal(parsed.lunchHours, "Ma–pe 8.00–14.00");
  });

  void it("parseAkseliOpeningHours extracts lunch and cafe hours from Ninan Keittio HTML", () => {
    const html = `
      <div>Palvelemme ma-pe klo 8-14.00 Kahvila 8-14.00 Aamupuuro klo 7.30-9.00 Lounas 10.30-13.30</div>
    `;
    const parsed = parseAkseliOpeningHours(html);
    assert.equal(parsed.restaurantId, "akseli");
    assert.equal(parsed.lunchHours, "Ma–pe 10.30–13.30");
    assert.equal(parsed.openHours, "Ma–pe 8.00–14.00");
  });

  void it("parseDylanLuftOpeningHours extracts lunch and cafe hours from HTML", () => {
    const html = `
      <section>
        <span>AUKIOLOAJAT</span>
        <span>MA-PE klo 8:00-14:00</span>
        <span>klo 10:30-14:00</span>
      </section>
    `;
    const parsed = parseDylanLuftOpeningHours(html);
    assert.equal(parsed.restaurantId, "dylan-luft");
    assert.equal(parsed.lunchHours, "Ma–pe 10.30–14.00");
    assert.equal(parsed.openHours, "Ma–pe 8.00–14.00");
  });

  void it("parseDylanBoleOpeningHours extracts lunch and cafe hours from HTML", () => {
    const html = `
      <section>
        <span>AUKIOLOAJAT</span>
        <span>MA-PE Lounas klo 10.30-14.00</span>
        <p>Kahvia ja muita pieniä herkkuja on saatavilla klo 8:00 - 15.45 asti.</p>
      </section>
    `;
    const parsed = parseDylanBoleOpeningHours(html);
    assert.equal(parsed.restaurantId, "dylan-bole");
    assert.equal(parsed.lunchHours, "Ma–pe 10.30–14.00");
    assert.equal(parsed.openHours, "Ma–pe 8.00–15.45");
  });

  void it("parseDylanLaIlmaOpeningHours extracts lunch and open hours from HTML", () => {
    const html = `
      <div>
        <p>AUKIOLOAJAT</p>
        <p>MA-PE klo 8:00-14:00</p>
        <p>MA-PE Lounas klo 10:30-14:00</p>
      </div>
    `;
    const parsed = parseDylanLaIlmaOpeningHours(html);
    assert.equal(parsed.restaurantId, "dylan-la-ilma");
    assert.equal(parsed.restaurantName, "Dylan La Ilma");
    assert.equal(parsed.lunchHours, "Ma–pe 10.30–14.00");
    assert.equal(parsed.openHours, "Ma–pe 8.00–14.00");
  });
});
