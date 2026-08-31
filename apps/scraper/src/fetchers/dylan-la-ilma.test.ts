import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DYLAN_LA_ILMA_DEFAULT_RSS_URL,
  DYLAN_LA_ILMA_RESTAURANT_ID,
  DYLAN_LA_ILMA_RESTAURANT_NAME,
  parseDylanLaIlmaRss,
} from "./dylan-la-ilma.js";

const SAMPLE_LA_ILMA_SINGLE_DAY_RSS = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>Dylan La Ilma</title>
        <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/70835b81-ec1f-443f-92bb-9832d21fb3af/2026/36/week-fi</link>
        <description>Dylan La Ilma Lounaslista</description>
        <lastBuildDate>Mon, 31 Aug 2026 07:35:58 GMT</lastBuildDate>
        <language>fi</language>
        <item>
            <title><![CDATA[Maanantai 31.8.]]></title>
            <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/70835b81-ec1f-443f-92bb-9832d21fb3af/2026/36/week-fi</link>
            <guid isPermaLink="false">dylan-la-ilma-2026-36-1</guid>
            <pubDate>Mon, 31 Aug 2026 00:00:00 GMT</pubDate>
            <description><![CDATA[Aamiaisella: Puurobaari<br>Pinaattikeittoa (L, G) ja keitettyjä kananmunia (M, G)<br>Kana vindaloo - kanaa ja kasviksia maukkaassa currykastikkeessa (M, G)<br>Jasmiiniriisiä (Veg, G)<br>Täyteläisen kermainen lohipastavuoka (L)<br>Tofu vindaloo - tofua ja kasviksia maukkaassa currykastikkeessa (V, G)<br>Persikkarahka (L, G)<br>CLASSIC BURGER - Naudan täyslihapihvi, cheddarjuustoa, chilimajoneesia, marinoitua punasipulia, tomaattia suolakurkkua ja salaattia. Lisäksi maalaisranskalaiset. (L, G*)<br>CLASSIG VEGE BURGER - Beyond- pihvi, cheddaria, chilimajoneesia, marinoitua punasipulia, tomaattia, suolakurkkua ja salaattia. Lisäksi maalaisranskalaiset. (L, G*)<br>CLASSIC VEGAN BURGER - Beyond -pihvi, vegaanista "cheddaria", chilimajoneesia, marinoitua punasipulia, tomaattia, suolakurkkua ja salaattia. Lisäksi maalaisranskalaiset (G*, Veg)]]></description>
        </item>
    </channel>
</rss>`;

const SAMPLE_LA_ILMA_WEEK_RSS = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>Dylan La Ilma</title>
        <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/70835b81-ec1f-443f-92bb-9832d21fb3af/2026/36/week-fi</link>
        <description>Dylan La Ilma Lounaslista</description>
        <lastBuildDate>Mon, 31 Aug 2026 07:35:58 GMT</lastBuildDate>
        <language>fi</language>
        <item>
            <title><![CDATA[Maanantai 31.8.]]></title>
            <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/70835b81-ec1f-443f-92bb-9832d21fb3af/2026/36/week-fi</link>
            <guid isPermaLink="false">dylan-la-ilma-2026-36-1</guid>
            <pubDate>Mon, 31 Aug 2026 00:00:00 GMT</pubDate>
            <description><![CDATA[Aamiaisella: Puurobaari<br>Pinaattikeittoa (L, G) ja keitettyjä kananmunia (M, G)<br>Kana vindaloo - kanaa ja kasviksia maukkaassa currykastikkeessa (M, G)<br>Jasmiiniriisiä (Veg, G)]]></description>
        </item>
        <item>
            <title><![CDATA[Tiistai 1.9.]]></title>
            <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/70835b81-ec1f-443f-92bb-9832d21fb3af/2026/36/week-fi</link>
            <guid isPermaLink="false">dylan-la-ilma-2026-36-2</guid>
            <pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>
            <description><![CDATA[Tomaattikeittoa (L, G)<br>Lihapyöryköitä ja kermakastiketta (L, G)]]></description>
        </item>
    </channel>
</rss>`;

void describe("dylan-la-ilma fetcher", () => {
  void it("exports correct restaurant constants", () => {
    assert.equal(DYLAN_LA_ILMA_RESTAURANT_ID, "dylan-la-ilma");
    assert.equal(DYLAN_LA_ILMA_RESTAURANT_NAME, "Dylan La Ilma");
    assert.equal(
      DYLAN_LA_ILMA_DEFAULT_RSS_URL,
      "https://lounastaja.app/api/v1/rss/week/70835b81-ec1f-443f-92bb-9832d21fb3af/current?days=current&language=fi",
    );
  });

  void it("parseDylanLaIlmaRss correctly extracts all menu items from sample RSS feed", () => {
    const items = parseDylanLaIlmaRss(
      SAMPLE_LA_ILMA_SINGLE_DAY_RSS,
      "2026-08-31",
    );

    assert.equal(items.length, 10);

    const item0 = items[0];
    assert.ok(item0);
    assert.equal(item0.item, "Aamiaisella: Puurobaari");
    assert.deepEqual(item0.dietaryFlags, []);
    assert.equal(item0.date, "2026-08-31");

    const item1 = items[1];
    assert.ok(item1);
    assert.equal(item1.item, "Pinaattikeittoa (L, G) ja keitettyjä kananmunia");
    assert.deepEqual(item1.dietaryFlags, ["M", "G"]);

    const item2 = items[2];
    assert.ok(item2);
    assert.equal(
      item2.item,
      "Kana vindaloo - kanaa ja kasviksia maukkaassa currykastikkeessa",
    );
    assert.deepEqual(item2.dietaryFlags, ["M", "G"]);

    const item3 = items[3];
    assert.ok(item3);
    assert.equal(item3.item, "Jasmiiniriisiä");
    assert.deepEqual(item3.dietaryFlags, ["Veg", "G"]);

    const item4 = items[4];
    assert.ok(item4);
    assert.equal(item4.item, "Täyteläisen kermainen lohipastavuoka");
    assert.deepEqual(item4.dietaryFlags, ["L"]);

    const item5 = items[5];
    assert.ok(item5);
    assert.equal(
      item5.item,
      "Tofu vindaloo - tofua ja kasviksia maukkaassa currykastikkeessa",
    );
    assert.deepEqual(item5.dietaryFlags, ["V", "G"]);

    const item6 = items[6];
    assert.ok(item6);
    assert.equal(item6.item, "Persikkarahka");
    assert.deepEqual(item6.dietaryFlags, ["L", "G"]);

    const item7 = items[7];
    assert.ok(item7);
    assert.equal(
      item7.item,
      "CLASSIC BURGER - Naudan täyslihapihvi, cheddarjuustoa, chilimajoneesia, marinoitua punasipulia, tomaattia suolakurkkua ja salaattia. Lisäksi maalaisranskalaiset.",
    );
    assert.deepEqual(item7.dietaryFlags, ["L", "G*"]);

    const item8 = items[8];
    assert.ok(item8);
    assert.equal(
      item8.item,
      "CLASSIG VEGE BURGER - Beyond- pihvi, cheddaria, chilimajoneesia, marinoitua punasipulia, tomaattia, suolakurkkua ja salaattia. Lisäksi maalaisranskalaiset.",
    );
    assert.deepEqual(item8.dietaryFlags, ["L", "G*"]);

    const item9 = items[9];
    assert.ok(item9);
    assert.equal(
      item9.item,
      'CLASSIC VEGAN BURGER - Beyond -pihvi, vegaanista "cheddaria", chilimajoneesia, marinoitua punasipulia, tomaattia, suolakurkkua ja salaattia. Lisäksi maalaisranskalaiset',
    );
    assert.deepEqual(item9.dietaryFlags, ["G*", "Veg"]);
  });

  void it("parseDylanLaIlmaRss matches target date in multi-day feed", () => {
    const mondayItems = parseDylanLaIlmaRss(
      SAMPLE_LA_ILMA_WEEK_RSS,
      "2026-08-31",
    );
    assert.equal(mondayItems.length, 4);
    const mon0 = mondayItems[0];
    assert.ok(mon0);
    assert.equal(mon0.item, "Aamiaisella: Puurobaari");

    const tuesdayItems = parseDylanLaIlmaRss(
      SAMPLE_LA_ILMA_WEEK_RSS,
      "2026-09-01",
    );
    assert.equal(tuesdayItems.length, 2);
    const tue0 = tuesdayItems[0];
    assert.ok(tue0);
    assert.equal(tue0.item, "Tomaattikeittoa");
    assert.deepEqual(tue0.dietaryFlags, ["L", "G"]);

    const nonExistentItems = parseDylanLaIlmaRss(
      SAMPLE_LA_ILMA_WEEK_RSS,
      "2026-09-02",
    );
    assert.equal(nonExistentItems.length, 0);
  });

  void it("handles empty or malformed XML gracefully", () => {
    assert.deepEqual(parseDylanLaIlmaRss("", "2026-08-31"), []);
    assert.deepEqual(
      parseDylanLaIlmaRss("<rss><channel></channel></rss>", "2026-08-31"),
      [],
    );
  });
});
