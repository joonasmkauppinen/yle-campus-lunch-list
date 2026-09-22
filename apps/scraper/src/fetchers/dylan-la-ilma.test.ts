import { describe, expect, it } from "vitest";

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

describe("dylan-la-ilma fetcher", () => {
  it("exports correct restaurant constants", () => {
    expect(DYLAN_LA_ILMA_RESTAURANT_ID).toBe("dylan-la-ilma");
    expect(DYLAN_LA_ILMA_RESTAURANT_NAME).toBe("Dylan La Ilma");
    expect(DYLAN_LA_ILMA_DEFAULT_RSS_URL).toBe(
      "https://lounastaja.app/api/v1/rss/week/70835b81-ec1f-443f-92bb-9832d21fb3af/current?days=current&language=fi",
    );
  });

  it("parseDylanLaIlmaRss correctly extracts all menu items from sample RSS feed", () => {
    const items = parseDylanLaIlmaRss(
      SAMPLE_LA_ILMA_SINGLE_DAY_RSS,
      "2026-08-31",
    );

    expect(items.length).toBe(10);

    const item0 = items[0];
    expect(item0).toBeTruthy();
    expect(item0?.item).toBe("Aamiaisella: Puurobaari");
    expect(item0?.dietaryFlags).toEqual([]);
    expect(item0?.date).toBe("2026-08-31");

    const item1 = items[1];
    expect(item1).toBeTruthy();
    expect(item1?.item).toBe("Pinaattikeittoa (L, G) ja keitettyjä kananmunia");
    expect(item1?.dietaryFlags).toEqual(["M", "G"]);

    const item2 = items[2];
    expect(item2).toBeTruthy();
    expect(item2?.item).toBe(
      "Kana vindaloo - kanaa ja kasviksia maukkaassa currykastikkeessa",
    );
    expect(item2?.dietaryFlags).toEqual(["M", "G"]);

    const item3 = items[3];
    expect(item3).toBeTruthy();
    expect(item3?.item).toBe("Jasmiiniriisiä");
    expect(item3?.dietaryFlags).toEqual(["Veg", "G"]);

    const item4 = items[4];
    expect(item4).toBeTruthy();
    expect(item4?.item).toBe("Täyteläisen kermainen lohipastavuoka");
    expect(item4?.dietaryFlags).toEqual(["L"]);

    const item5 = items[5];
    expect(item5).toBeTruthy();
    expect(item5?.item).toBe(
      "Tofu vindaloo - tofua ja kasviksia maukkaassa currykastikkeessa",
    );
    expect(item5?.dietaryFlags).toEqual(["V", "G"]);

    const item6 = items[6];
    expect(item6).toBeTruthy();
    expect(item6?.item).toBe("Persikkarahka");
    expect(item6?.dietaryFlags).toEqual(["L", "G"]);

    const item7 = items[7];
    expect(item7).toBeTruthy();
    expect(item7?.item).toBe(
      "CLASSIC BURGER - Naudan täyslihapihvi, cheddarjuustoa, chilimajoneesia, marinoitua punasipulia, tomaattia suolakurkkua ja salaattia. Lisäksi maalaisranskalaiset.",
    );
    expect(item7?.dietaryFlags).toEqual(["L", "G*"]);

    const item8 = items[8];
    expect(item8).toBeTruthy();
    expect(item8?.item).toBe(
      "CLASSIG VEGE BURGER - Beyond- pihvi, cheddaria, chilimajoneesia, marinoitua punasipulia, tomaattia, suolakurkkua ja salaattia. Lisäksi maalaisranskalaiset.",
    );
    expect(item8?.dietaryFlags).toEqual(["L", "G*"]);

    const item9 = items[9];
    expect(item9).toBeTruthy();
    expect(item9?.item).toBe(
      'CLASSIC VEGAN BURGER - Beyond -pihvi, vegaanista "cheddaria", chilimajoneesia, marinoitua punasipulia, tomaattia, suolakurkkua ja salaattia. Lisäksi maalaisranskalaiset',
    );
    expect(item9?.dietaryFlags).toEqual(["G*", "Veg"]);
  });

  it("parseDylanLaIlmaRss matches target date in multi-day feed", () => {
    const mondayItems = parseDylanLaIlmaRss(
      SAMPLE_LA_ILMA_WEEK_RSS,
      "2026-08-31",
    );
    expect(mondayItems.length).toBe(4);
    const mon0 = mondayItems[0];
    expect(mon0).toBeTruthy();
    expect(mon0?.item).toBe("Aamiaisella: Puurobaari");

    const tuesdayItems = parseDylanLaIlmaRss(
      SAMPLE_LA_ILMA_WEEK_RSS,
      "2026-09-01",
    );
    expect(tuesdayItems.length).toBe(2);
    const tue0 = tuesdayItems[0];
    expect(tue0).toBeTruthy();
    expect(tue0?.item).toBe("Tomaattikeittoa");
    expect(tue0?.dietaryFlags).toEqual(["L", "G"]);

    const nonExistentItems = parseDylanLaIlmaRss(
      SAMPLE_LA_ILMA_WEEK_RSS,
      "2026-09-02",
    );
    expect(nonExistentItems.length).toBe(0);
  });

  it("handles empty or malformed XML gracefully", () => {
    expect(parseDylanLaIlmaRss("", "2026-08-31")).toEqual([]);
    expect(
      parseDylanLaIlmaRss("<rss><channel></channel></rss>", "2026-08-31"),
    ).toEqual([]);
  });
});
