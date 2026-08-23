import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DYLAN_LUFT_RESTAURANT_ID,
  DYLAN_LUFT_RESTAURANT_NAME,
  parseDylanDescription,
  parseDylanLine,
  parseDylanLuftRss,
  unescapeXml,
} from "./dylan-luft.js";

const SAMPLE_SINGLE_DAY_RSS = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>Dylan Luft</title>
        <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/5843f3ec-6a2c-49ba-ba3e-b384f6c996f1/2026/34/week-fi</link>
        <description>Dylan Luft Lounaslista</description>
        <lastBuildDate>Fri, 21 Aug 2026 20:28:02 GMT</lastBuildDate>
        <language>fi</language>
        <item>
            <title><![CDATA[Perjantai 21.8.]]></title>
            <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/5843f3ec-6a2c-49ba-ba3e-b384f6c996f1/2026/34/week-fi</link>
            <guid isPermaLink="false">dylan-luft-2026-34-5</guid>
            <pubDate>Fri, 21 Aug 2026 00:00:00 GMT</pubDate>
            <description><![CDATA[Dylan Luftin buffetlounas sisältää runsaan salaattipöydän sekä vastapaistettua leipää. Kysy tarvittaessa vegaanista ja gluteenitonta vaihtoehtoa henkilökunnalta<br>Aamupuuro:Kaurapuuro (Veg)<br>Kesäkeittoa ja rakuunaöljyä (L, G)<br>Kasvisgyosat kookoscurrykastikkeessa (Veg)<br>Rapeaa kana Cordon bleuta ja srirachamajoneesia (L)<br>Ylikypsää porsaanniskaa Tamarind-kastikkeessa (M, G)<br>Paistettua riisiä (G, Veg)<br>Päivän makea jälkiruoka]]></description>
        </item>
    </channel>
</rss>`;

const SAMPLE_WEEK_RSS = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>Dylan Luft</title>
        <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/5843f3ec-6a2c-49ba-ba3e-b384f6c996f1/2026/34/week-fi</link>
        <description>Dylan Luft Lounaslista</description>
        <lastBuildDate>Fri, 21 Aug 2026 20:28:23 GMT</lastBuildDate>
        <language>fi</language>
        <item>
            <title><![CDATA[Maanantai 17.8.]]></title>
            <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/5843f3ec-6a2c-49ba-ba3e-b384f6c996f1/2026/34/week-fi</link>
            <guid isPermaLink="false">dylan-luft-2026-34-1</guid>
            <pubDate>Mon, 17 Aug 2026 00:00:00 GMT</pubDate>
            <description><![CDATA[Dylan Luftin buffetlounas sisältää runsaan salaattipöydän sekä vastapaistettua leipää. Kysy tarvittaessa vegaanista ja gluteenitonta vaihtoehtoa henkilökunnalta<br>Aamupuuro:Kaurapuuro (Veg)<br>Tuorejuusto-kasvissosekeitto (L, G)<br>Ihanaa uuni"feta"pastaa, paahdettua kirsikkatomaattia sekä rucolaa (Veg)<br>Broileria maukkaassa maapähkinäkastikkeessa "Satay" (M,G, sis. pähkinää)<br>Paahdettua puna-ahventa sitrusvoikastikkeessa (L, G)<br>Lyttyperunoita ja hapankermaa (L, G)<br>Suklaamousse (L, G)]]></description>
        </item>
        <item>
            <title><![CDATA[Perjantai 21.8.]]></title>
            <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/5843f3ec-6a2c-49ba-ba3e-b384f6c996f1/2026/34/week-fi</link>
            <guid isPermaLink="false">dylan-luft-2026-34-5</guid>
            <pubDate>Fri, 21 Aug 2026 00:00:00 GMT</pubDate>
            <description><![CDATA[Dylan Luftin buffetlounas sisältää runsaan salaattipöydän sekä vastapaistettua leipää. Kysy tarvittaessa vegaanista ja gluteenitonta vaihtoehtoa henkilökunnalta<br>Aamupuuro:Kaurapuuro (Veg)<br>Kesäkeittoa ja rakuunaöljyä (L, G)<br>Kasvisgyosat kookoscurrykastikkeessa (Veg)<br>Rapeaa kana Cordon bleuta ja srirachamajoneesia (L)<br>Ylikypsää porsaanniskaa Tamarind-kastikkeessa (M, G)<br>Paistettua riisiä (G, Veg)<br>Päivän makea jälkiruoka]]></description>
        </item>
    </channel>
</rss>`;

void describe("dylan-luft fetcher", () => {
  void it("exports correct restaurant constants", () => {
    assert.equal(DYLAN_LUFT_RESTAURANT_ID, "dylan-luft");
    assert.equal(DYLAN_LUFT_RESTAURANT_NAME, "Dylan Luft");
  });

  void it("unescapeXml converts XML entities", () => {
    assert.equal(unescapeXml("&amp; &lt; &gt; &quot; &#39;"), "& < > \" '");
  });

  void it("parseDylanLine handles various menu item formats and filters boilerplate", () => {
    // Boilerplate intro should be filtered
    assert.equal(
      parseDylanLine(
        "Dylan Luftin buffetlounas sisältää runsaan salaattipöydän sekä vastapaistettua leipää. Kysy tarvittaessa vegaanista ja gluteenitonta vaihtoehtoa henkilökunnalta",
        "2026-08-21",
      ),
      null,
    );

    // Parenthesized dietary flags
    const item1 = parseDylanLine(
      "Kesäkeittoa ja rakuunaöljyä (L, G)",
      "2026-08-21",
    );
    assert.deepEqual(item1, {
      date: "2026-08-21",
      item: "Kesäkeittoa ja rakuunaöljyä",
      dietaryFlags: ["L", "G"],
    });

    // Aamupuuro formatting normalization
    const item2 = parseDylanLine("Aamupuuro:Kaurapuuro (Veg)", "2026-08-21");
    assert.deepEqual(item2, {
      date: "2026-08-21",
      item: "Aamupuuro: Kaurapuuro",
      dietaryFlags: ["Veg"],
    });

    // Custom dietary flag notes like 'sis. pähkinää'
    const item3 = parseDylanLine(
      'Broileria maukkaassa maapähkinäkastikkeessa "Satay" (M,G, sis. pähkinää)',
      "2026-08-21",
    );
    assert.deepEqual(item3, {
      date: "2026-08-21",
      item: 'Broileria maukkaassa maapähkinäkastikkeessa "Satay"',
      dietaryFlags: ["M", "G", "sis. pähkinää"],
    });

    // Trailing dietary flags without parentheses
    const item4 = parseDylanLine(
      "Maapähkinävoilla höystetty kanakeitto M, G",
      "2026-08-21",
    );
    assert.deepEqual(item4, {
      date: "2026-08-21",
      item: "Maapähkinävoilla höystetty kanakeitto",
      dietaryFlags: ["M", "G"],
    });

    // No dietary flags
    const item5 = parseDylanLine("Päivän makea jälkiruoka", "2026-08-21");
    assert.deepEqual(item5, {
      date: "2026-08-21",
      item: "Päivän makea jälkiruoka",
      dietaryFlags: [],
    });
  });

  void it("parseDylanDescription extracts all menu items from description HTML", () => {
    const desc =
      "Dylan Luftin buffetlounas sisältää runsaan salaattipöydän...<br>Aamupuuro:Kaurapuuro (Veg)<br>Kesäkeittoa ja rakuunaöljyä (L, G)<br>Päivän makea jälkiruoka";
    const items = parseDylanDescription(desc, "2026-08-21");

    assert.equal(items.length, 3);
    const item0 = items[0];
    assert.ok(item0);
    assert.equal(item0.item, "Aamupuuro: Kaurapuuro");
    assert.deepEqual(item0.dietaryFlags, ["Veg"]);

    const item1 = items[1];
    assert.ok(item1);
    assert.equal(item1.item, "Kesäkeittoa ja rakuunaöljyä");
    assert.deepEqual(item1.dietaryFlags, ["L", "G"]);

    const item2 = items[2];
    assert.ok(item2);
    assert.equal(item2.item, "Päivän makea jälkiruoka");
    assert.deepEqual(item2.dietaryFlags, []);
  });

  void it("parseDylanLuftRss extracts items from single-day RSS feed", () => {
    const items = parseDylanLuftRss(SAMPLE_SINGLE_DAY_RSS, "2026-08-21");

    assert.equal(items.length, 7);
    const item0 = items[0];
    assert.ok(item0);
    assert.equal(item0.item, "Aamupuuro: Kaurapuuro");
    assert.deepEqual(item0.dietaryFlags, ["Veg"]);

    const item1 = items[1];
    assert.ok(item1);
    assert.equal(item1.item, "Kesäkeittoa ja rakuunaöljyä");
    assert.deepEqual(item1.dietaryFlags, ["L", "G"]);

    const item2 = items[2];
    assert.ok(item2);
    assert.equal(item2.item, "Kasvisgyosat kookoscurrykastikkeessa");
    assert.deepEqual(item2.dietaryFlags, ["Veg"]);

    const item3 = items[3];
    assert.ok(item3);
    assert.equal(item3.item, "Rapeaa kana Cordon bleuta ja srirachamajoneesia");
    assert.deepEqual(item3.dietaryFlags, ["L"]);

    const item4 = items[4];
    assert.ok(item4);
    assert.equal(item4.item, "Ylikypsää porsaanniskaa Tamarind-kastikkeessa");
    assert.deepEqual(item4.dietaryFlags, ["M", "G"]);

    const item5 = items[5];
    assert.ok(item5);
    assert.equal(item5.item, "Paistettua riisiä");
    assert.deepEqual(item5.dietaryFlags, ["G", "Veg"]);

    const item6 = items[6];
    assert.ok(item6);
    assert.equal(item6.item, "Päivän makea jälkiruoka");
    assert.deepEqual(item6.dietaryFlags, []);
  });

  void it("parseDylanLuftRss extracts target date from multi-day RSS feed", () => {
    const mondayItems = parseDylanLuftRss(SAMPLE_WEEK_RSS, "2026-08-17");
    assert.equal(mondayItems.length, 7);
    const mon0 = mondayItems[0];
    assert.ok(mon0);
    assert.equal(mon0.item, "Aamupuuro: Kaurapuuro");

    const mon1 = mondayItems[1];
    assert.ok(mon1);
    assert.equal(mon1.item, "Tuorejuusto-kasvissosekeitto");
    assert.deepEqual(mon1.dietaryFlags, ["L", "G"]);

    const fridayItems = parseDylanLuftRss(SAMPLE_WEEK_RSS, "2026-08-21");
    assert.equal(fridayItems.length, 7);
    const fri1 = fridayItems[1];
    assert.ok(fri1);
    assert.equal(fri1.item, "Kesäkeittoa ja rakuunaöljyä");

    const nonExistentItems = parseDylanLuftRss(SAMPLE_WEEK_RSS, "2026-08-19");
    assert.equal(nonExistentItems.length, 0);
  });

  void it("handles empty or malformed XML gracefully", () => {
    assert.deepEqual(parseDylanLuftRss("", "2026-08-21"), []);
    assert.deepEqual(
      parseDylanLuftRss("<rss><channel></channel></rss>", "2026-08-21"),
      [],
    );
  });
});
