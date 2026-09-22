import { describe, expect, it } from "vitest";

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

describe("dylan-luft fetcher", () => {
  it("exports correct restaurant constants", () => {
    expect(DYLAN_LUFT_RESTAURANT_ID).toBe("dylan-luft");
    expect(DYLAN_LUFT_RESTAURANT_NAME).toBe("Dylan Luft");
  });

  it("unescapeXml converts XML entities", () => {
    expect(unescapeXml("&amp; &lt; &gt; &quot; &#39;")).toBe("& < > \" '");
  });

  it("parseDylanLine handles various menu item formats and filters boilerplate", () => {
    // Boilerplate intro should be filtered
    expect(
      parseDylanLine(
        "Dylan Luftin buffetlounas sisältää runsaan salaattipöydän sekä vastapaistettua leipää. Kysy tarvittaessa vegaanista ja gluteenitonta vaihtoehtoa henkilökunnalta",
        "2026-08-21",
      ),
    ).toBeNull();

    // Parenthesized dietary flags
    const item1 = parseDylanLine(
      "Kesäkeittoa ja rakuunaöljyä (L, G)",
      "2026-08-21",
    );
    expect(item1).toEqual({
      date: "2026-08-21",
      item: "Kesäkeittoa ja rakuunaöljyä",
      dietaryFlags: ["L", "G"],
    });

    // Aamupuuro formatting normalization
    const item2 = parseDylanLine("Aamupuuro:Kaurapuuro (Veg)", "2026-08-21");
    expect(item2).toEqual({
      date: "2026-08-21",
      item: "Aamupuuro: Kaurapuuro",
      dietaryFlags: ["Veg"],
    });

    // Custom dietary flag notes like 'sis. pähkinää'
    const item3 = parseDylanLine(
      'Broileria maukkaassa maapähkinäkastikkeessa "Satay" (M,G, sis. pähkinää)',
      "2026-08-21",
    );
    expect(item3).toEqual({
      date: "2026-08-21",
      item: 'Broileria maukkaassa maapähkinäkastikkeessa "Satay"',
      dietaryFlags: ["M", "G", "sis. pähkinää"],
    });

    // Trailing dietary flags without parentheses
    const item4 = parseDylanLine(
      "Maapähkinävoilla höystetty kanakeitto M, G",
      "2026-08-21",
    );
    expect(item4).toEqual({
      date: "2026-08-21",
      item: "Maapähkinävoilla höystetty kanakeitto",
      dietaryFlags: ["M", "G"],
    });

    // No dietary flags
    const item5 = parseDylanLine("Päivän makea jälkiruoka", "2026-08-21");
    expect(item5).toEqual({
      date: "2026-08-21",
      item: "Päivän makea jälkiruoka",
      dietaryFlags: [],
    });
  });

  it("parseDylanDescription extracts all menu items from description HTML", () => {
    const desc =
      "Dylan Luftin buffetlounas sisältää runsaan salaattipöydän...<br>Aamupuuro:Kaurapuuro (Veg)<br>Kesäkeittoa ja rakuunaöljyä (L, G)<br>Päivän makea jälkiruoka";
    const items = parseDylanDescription(desc, "2026-08-21");

    expect(items.length).toBe(3);
    const item0 = items[0];
    expect(item0).toBeTruthy();
    expect(item0?.item).toBe("Aamupuuro: Kaurapuuro");
    expect(item0?.dietaryFlags).toEqual(["Veg"]);

    const item1 = items[1];
    expect(item1).toBeTruthy();
    expect(item1?.item).toBe("Kesäkeittoa ja rakuunaöljyä");
    expect(item1?.dietaryFlags).toEqual(["L", "G"]);

    const item2 = items[2];
    expect(item2).toBeTruthy();
    expect(item2?.item).toBe("Päivän makea jälkiruoka");
    expect(item2?.dietaryFlags).toEqual([]);
  });

  it("parseDylanLuftRss extracts items from single-day RSS feed", () => {
    const items = parseDylanLuftRss(SAMPLE_SINGLE_DAY_RSS, "2026-08-21");

    expect(items.length).toBe(7);
    const item0 = items[0];
    expect(item0).toBeTruthy();
    expect(item0?.item).toBe("Aamupuuro: Kaurapuuro");
    expect(item0?.dietaryFlags).toEqual(["Veg"]);

    const item1 = items[1];
    expect(item1).toBeTruthy();
    expect(item1?.item).toBe("Kesäkeittoa ja rakuunaöljyä");
    expect(item1?.dietaryFlags).toEqual(["L", "G"]);

    const item2 = items[2];
    expect(item2).toBeTruthy();
    expect(item2?.item).toBe("Kasvisgyosat kookoscurrykastikkeessa");
    expect(item2?.dietaryFlags).toEqual(["Veg"]);

    const item3 = items[3];
    expect(item3).toBeTruthy();
    expect(item3?.item).toBe("Rapeaa kana Cordon bleuta ja srirachamajoneesia");
    expect(item3?.dietaryFlags).toEqual(["L"]);

    const item4 = items[4];
    expect(item4).toBeTruthy();
    expect(item4?.item).toBe("Ylikypsää porsaanniskaa Tamarind-kastikkeessa");
    expect(item4?.dietaryFlags).toEqual(["M", "G"]);

    const item5 = items[5];
    expect(item5).toBeTruthy();
    expect(item5?.item).toBe("Paistettua riisiä");
    expect(item5?.dietaryFlags).toEqual(["G", "Veg"]);

    const item6 = items[6];
    expect(item6).toBeTruthy();
    expect(item6?.item).toBe("Päivän makea jälkiruoka");
    expect(item6?.dietaryFlags).toEqual([]);
  });

  it("parseDylanLuftRss extracts target date from multi-day RSS feed", () => {
    const mondayItems = parseDylanLuftRss(SAMPLE_WEEK_RSS, "2026-08-17");
    expect(mondayItems.length).toBe(7);
    const mon0 = mondayItems[0];
    expect(mon0).toBeTruthy();
    expect(mon0?.item).toBe("Aamupuuro: Kaurapuuro");

    const mon1 = mondayItems[1];
    expect(mon1).toBeTruthy();
    expect(mon1?.item).toBe("Tuorejuusto-kasvissosekeitto");
    expect(mon1?.dietaryFlags).toEqual(["L", "G"]);

    const fridayItems = parseDylanLuftRss(SAMPLE_WEEK_RSS, "2026-08-21");
    expect(fridayItems.length).toBe(7);
    const fri1 = fridayItems[1];
    expect(fri1).toBeTruthy();
    expect(fri1?.item).toBe("Kesäkeittoa ja rakuunaöljyä");

    const nonExistentItems = parseDylanLuftRss(SAMPLE_WEEK_RSS, "2026-08-19");
    expect(nonExistentItems.length).toBe(0);
  });

  it("handles empty or malformed XML gracefully", () => {
    expect(parseDylanLuftRss("", "2026-08-21")).toEqual([]);
    expect(
      parseDylanLuftRss("<rss><channel></channel></rss>", "2026-08-21"),
    ).toEqual([]);
  });
});
