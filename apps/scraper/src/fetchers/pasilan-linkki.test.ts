import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  decodeHtmlEntities,
  extractCompassItemDate,
  parseCompassDescription,
  parseCompassLine,
  parsePasilanLinkkiRss,
  PASILAN_LINKKI_DEFAULT_RSS_URL,
  PASILAN_LINKKI_RESTAURANT_ID,
  PASILAN_LINKKI_RESTAURANT_NAME,
} from "./pasilan-linkki.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_LINKKI_XML_PATH = path.resolve(
  __dirname,
  "../../../../docs/linkki-rss-sample-data.xml",
);

const SAMPLE_LINKKI_XML = fs.readFileSync(SAMPLE_LINKKI_XML_PATH, "utf-8");

const SAMPLE_WEEKLY_LINKKI_XML = `<?xml version="1.0" encoding="utf-8"?>
<rss xmlns:a10="http://www.w3.org/2005/Atom" version="2.0">
  <channel>
    <title>Linkki</title>
    <link>https://www.compass-group.fi/menuapi/feed/rss/current-week?costNumber=3642&amp;language=fi</link>
    <description>Linkki</description>
    <a10:id>https://www.compass-group.fi/menuapi/feed/rss/current-week?costNumber=3642&amp;language=fi</a10:id>
    <item>
      <guid isPermaLink="false">https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/#17-08-2026</guid>
      <link>https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/</link>
      <title>Maanantai, 17-08-2026</title>
      <description>&lt;p&gt;Lounas buffet 10&amp;euro;&lt;/p&gt;
&lt;p&gt;&amp;nbsp;&lt;/p&gt;
&lt;p&gt;Sienikeittoa (A, ILM, L)&lt;/p&gt;
&lt;p&gt;Mausteista tofupastaa (A, ILM, L, M, Veg, VS)&lt;/p&gt;
&lt;p&gt;Perinteisi&amp;auml; silakkapihvej&amp;auml; (A, ILM, L, M)&lt;/p&gt;
&lt;p&gt;Tillikermaviili&amp;auml; (A, G, L)&lt;/p&gt;
&lt;p&gt;Broileria tomaattikastikkeessa - Murg Makhani (A, G, L, VS)&lt;/p&gt;
&lt;p&gt;Mangorahkaa (A, G, L)&lt;/p&gt;</description>
    </item>
    <item>
      <guid isPermaLink="false">https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/#21-08-2026</guid>
      <link>https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/</link>
      <title>Perjantai, 21-08-2026</title>
      <description>&lt;p&gt;Lounas buffet 10&amp;euro;&lt;/p&gt;
&lt;p&gt;&amp;nbsp;&lt;/p&gt;
&lt;p&gt;Bataattikeittoa (*, A, G, L)&lt;/p&gt;
&lt;p&gt;Halloumi-kukkakaalikormaa (A, G, VS) ja Riisi&amp;auml; (G, L, M, Veg)&lt;/p&gt;
&lt;p&gt;Uuniperunaa ja kylm&amp;auml;savukirjolohit&amp;auml;ytett&amp;auml; (A, L, G)&lt;/p&gt;
&lt;p&gt;Kanaa Kiovan tapaan (A, L, VS) ja Chilimajoneesia (A, L, M, G)&lt;/p&gt;
&lt;p&gt;Jogurttipannacottaa (A, G, L) ja Mustaherukkahilloketta (G, L, M, Veg)&lt;/p&gt;</description>
    </item>
    <item>
      <guid isPermaLink="false">https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/#22-08-2026</guid>
      <link>https://www.compass-group.fi/ravintolat-ja-ruokalistat/foodco/kaupungit/helsinki/linkki/</link>
      <title>Lauantai, 22-08-2026</title>
      <description />
    </item>
  </channel>
</rss>`;

describe("pasilan-linkki fetcher", () => {
  it("exports correct restaurant constants", () => {
    expect(PASILAN_LINKKI_RESTAURANT_ID).toBe("pasilan-linkki");
    expect(PASILAN_LINKKI_RESTAURANT_NAME).toBe("Pasilan Linkki");
    expect(PASILAN_LINKKI_DEFAULT_RSS_URL).toContain("costNumber=3642");
  });

  it("decodeHtmlEntities unescapes HTML entities correctly", () => {
    expect(
      decodeHtmlEntities("Lounas 10&euro; &auml; &ouml; &nbsp; &amp;"),
    ).toBe("Lounas 10€ ä ö   &");
  });

  it("extractCompassItemDate extracts ISO date correctly", () => {
    expect(extractCompassItemDate("<title>Perjantai, 21-08-2026</title>")).toBe(
      "2026-08-21",
    );
    expect(
      extractCompassItemDate("<guid>https://compass.fi/#17-08-2026</guid>"),
    ).toBe("2026-08-17");
  });

  it("parseCompassLine handles dish names, dietary flags and filters boilerplate", () => {
    // Boilerplate should be filtered
    expect(parseCompassLine("Lounas buffet 10&euro;", "2026-08-21")).toBeNull();
    expect(parseCompassLine("&nbsp;", "2026-08-21")).toBeNull();

    // Single parenthesized flag group
    const item1 = parseCompassLine(
      "Bataattikeittoa (*, A, G, L)",
      "2026-08-21",
    );
    expect(item1).toEqual({
      date: "2026-08-21",
      item: "Bataattikeittoa",
      dietaryFlags: ["*", "A", "G", "L"],
    });

    // Multiple parenthesized flag groups in one dish line
    const item2 = parseCompassLine(
      "Halloumi-kukkakaalikormaa (A, G, VS) ja Riisi&auml; (G, L, M, Veg)",
      "2026-08-21",
    );
    expect(item2).toEqual({
      date: "2026-08-21",
      item: "Halloumi-kukkakaalikormaa ja Riisiä",
      dietaryFlags: ["A", "G", "VS", "L", "M", "Veg"],
    });
  });

  it("parseCompassDescription parses full description HTML", () => {
    const desc = `<p>Lounas buffet 10&euro;</p><p>&nbsp;</p><p>Bataattikeittoa (*, A, G, L)</p><p>Kanaa Kiovan tapaan (A, L, VS) ja Chilimajoneesia (A, L, M, G)</p>`;
    const items = parseCompassDescription(desc, "2026-08-21");

    expect(items.length).toBe(2);
    const item0 = items[0];
    expect(item0).toBeTruthy();
    expect(item0?.item).toBe("Bataattikeittoa");
    expect(item0?.dietaryFlags).toEqual(["*", "A", "G", "L"]);

    const item1 = items[1];
    expect(item1).toBeTruthy();
    expect(item1?.item).toBe("Kanaa Kiovan tapaan ja Chilimajoneesia");
    expect(item1?.dietaryFlags).toEqual(["A", "L", "VS", "M", "G"]);
  });

  it("parsePasilanLinkkiRss correctly extracts all menu items from sample RSS feed", () => {
    const items = parsePasilanLinkkiRss(SAMPLE_LINKKI_XML, "2026-08-21");

    expect(items.length).toBe(5);

    expect(items[0]).toEqual({
      date: "2026-08-21",
      item: "Bataattikeittoa",
      dietaryFlags: ["*", "A", "G", "L"],
    });

    expect(items[1]).toEqual({
      date: "2026-08-21",
      item: "Halloumi-kukkakaalikormaa ja Riisiä",
      dietaryFlags: ["A", "G", "VS", "L", "M", "Veg"],
    });

    expect(items[2]).toEqual({
      date: "2026-08-21",
      item: "Uuniperunaa ja kylmäsavukirjolohitäytettä",
      dietaryFlags: ["A", "L", "G"],
    });

    expect(items[3]).toEqual({
      date: "2026-08-21",
      item: "Kanaa Kiovan tapaan ja Chilimajoneesia",
      dietaryFlags: ["A", "L", "VS", "M", "G"],
    });

    expect(items[4]).toEqual({
      date: "2026-08-21",
      item: "Jogurttipannacottaa ja Mustaherukkahilloketta",
      dietaryFlags: ["A", "G", "L", "M", "Veg"],
    });
  });

  it("parsePasilanLinkkiRss matches target date in weekly RSS feed", () => {
    const mondayItems = parsePasilanLinkkiRss(
      SAMPLE_WEEKLY_LINKKI_XML,
      "2026-08-17",
    );
    expect(mondayItems.length).toBe(6);
    const mon0 = mondayItems[0];
    expect(mon0).toBeTruthy();
    expect(mon0?.item).toBe("Sienikeittoa");
    expect(mon0?.dietaryFlags).toEqual(["A", "ILM", "L"]);

    const fridayItems = parsePasilanLinkkiRss(
      SAMPLE_WEEKLY_LINKKI_XML,
      "2026-08-21",
    );
    expect(fridayItems.length).toBe(5);
    const fri0 = fridayItems[0];
    expect(fri0).toBeTruthy();
    expect(fri0?.item).toBe("Bataattikeittoa");

    const nonExistentItems = parsePasilanLinkkiRss(
      SAMPLE_WEEKLY_LINKKI_XML,
      "2026-08-19",
    );
    expect(nonExistentItems.length).toBe(0);
  });

  it("handles empty or malformed XML gracefully", () => {
    expect(parsePasilanLinkkiRss("", "2026-08-21")).toEqual([]);
    expect(
      parsePasilanLinkkiRss("<rss><channel></channel></rss>", "2026-08-21"),
    ).toEqual([]);
  });
});
