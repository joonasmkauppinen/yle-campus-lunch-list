import { describe, expect, it } from "vitest";

import {
  DYLAN_BOLE_DEFAULT_RSS_URL,
  DYLAN_BOLE_RESTAURANT_ID,
  DYLAN_BOLE_RESTAURANT_NAME,
  parseDylanBoleRss,
} from "./dylan-bole.js";

const SAMPLE_BOLE_SINGLE_DAY_RSS = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>Dylan Böle</title>
        <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/2026/34/week-fi</link>
        <description>Dylan Böle Lounaslista</description>
        <lastBuildDate>Fri, 21 Aug 2026 16:33:00 GMT</lastBuildDate>
        <language>fi</language>
        <item>
            <title><![CDATA[Perjantai 21.8.]]></title>
            <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/2026/34/week-fi</link>
            <guid isPermaLink="false">dylan-bole-2026-34-5</guid>
            <pubDate>Fri, 21 Aug 2026 00:00:00 GMT</pubDate>
            <description><![CDATA[Maapähkinävoilla höystetty kanakeitto M, G<br>Meksikolainen kasvis pihvi & lime-hummus V, G<br>Naudan sisäfileetä punaviinikastikkeella M, G<br>Kermaista savulohi perunalaatikkoa ja kevätsipulia (L, G)<br>Paahdettuja uunijuureksia & perunaa V, G<br>🧡Talon porkkanakakku L]]></description>
        </item>
    </channel>
</rss>`;

const SAMPLE_BOLE_WEEK_RSS = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>Dylan Böle</title>
        <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/2026/34/week-fi</link>
        <description>Dylan Böle Lounaslista</description>
        <lastBuildDate>Fri, 21 Aug 2026 16:33:00 GMT</lastBuildDate>
        <language>fi</language>
        <item>
            <title><![CDATA[Torstai 20.8.]]></title>
            <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/2026/34/week-fi</link>
            <guid isPermaLink="false">dylan-bole-2026-34-4</guid>
            <pubDate>Thu, 20 Aug 2026 00:00:00 GMT</pubDate>
            <description><![CDATA[Kermainen lohikeitto (L, G)<br>Pinaattiohukaisia ja puolukkahilloa (L)<br>Dylan Bölen hernepannukakku L]]></description>
        </item>
        <item>
            <title><![CDATA[Perjantai 21.8.]]></title>
            <link>https://lounastaja.app/api/v1/image/lunchlist/pdf/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/2026/34/week-fi</link>
            <guid isPermaLink="false">dylan-bole-2026-34-5</guid>
            <pubDate>Fri, 21 Aug 2026 00:00:00 GMT</pubDate>
            <description><![CDATA[Maapähkinävoilla höystetty kanakeitto M, G<br>Meksikolainen kasvis pihvi & lime-hummus V, G<br>Naudan sisäfileetä punaviinikastikkeella M, G<br>Kermaista savulohi perunalaatikkoa ja kevätsipulia (L, G)<br>Paahdettuja uunijuureksia & perunaa V, G<br>🧡Talon porkkanakakku L]]></description>
        </item>
    </channel>
</rss>`;

describe("dylan-bole fetcher", () => {
  it("exports correct restaurant constants", () => {
    expect(DYLAN_BOLE_RESTAURANT_ID).toBe("dylan-bole");
    expect(DYLAN_BOLE_RESTAURANT_NAME).toBe("Dylan Böle");
    expect(DYLAN_BOLE_DEFAULT_RSS_URL).toBe(
      "https://lounastaja.app/api/v1/rss/week/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/current?days=current&language=fi",
    );
  });

  it("parseDylanBoleRss correctly extracts all menu items from sample RSS feed", () => {
    const items = parseDylanBoleRss(SAMPLE_BOLE_SINGLE_DAY_RSS, "2026-08-21");

    expect(items.length).toBe(6);

    const item0 = items[0];
    expect(item0).toBeTruthy();
    expect(item0?.item).toBe("Maapähkinävoilla höystetty kanakeitto");
    expect(item0?.dietaryFlags).toEqual(["M", "G"]);
    expect(item0?.date).toBe("2026-08-21");

    const item1 = items[1];
    expect(item1).toBeTruthy();
    expect(item1?.item).toBe("Meksikolainen kasvis pihvi & lime-hummus");
    expect(item1?.dietaryFlags).toEqual(["V", "G"]);

    const item2 = items[2];
    expect(item2).toBeTruthy();
    expect(item2?.item).toBe("Naudan sisäfileetä punaviinikastikkeella");
    expect(item2?.dietaryFlags).toEqual(["M", "G"]);

    const item3 = items[3];
    expect(item3).toBeTruthy();
    expect(item3?.item).toBe(
      "Kermaista savulohi perunalaatikkoa ja kevätsipulia",
    );
    expect(item3?.dietaryFlags).toEqual(["L", "G"]);

    const item4 = items[4];
    expect(item4).toBeTruthy();
    expect(item4?.item).toBe("Paahdettuja uunijuureksia & perunaa");
    expect(item4?.dietaryFlags).toEqual(["V", "G"]);

    const item5 = items[5];
    expect(item5).toBeTruthy();
    expect(item5?.item).toBe("🧡Talon porkkanakakku");
    expect(item5?.dietaryFlags).toEqual(["L"]);
  });

  it("parseDylanBoleRss matches target date in multi-day feed", () => {
    const thursdayItems = parseDylanBoleRss(SAMPLE_BOLE_WEEK_RSS, "2026-08-20");
    expect(thursdayItems.length).toBe(3);
    const thu0 = thursdayItems[0];
    expect(thu0).toBeTruthy();
    expect(thu0?.item).toBe("Kermainen lohikeitto");
    expect(thu0?.dietaryFlags).toEqual(["L", "G"]);

    const fridayItems = parseDylanBoleRss(SAMPLE_BOLE_WEEK_RSS, "2026-08-21");
    expect(fridayItems.length).toBe(6);
    const fri0 = fridayItems[0];
    expect(fri0).toBeTruthy();
    expect(fri0?.item).toBe("Maapähkinävoilla höystetty kanakeitto");

    const nonExistentItems = parseDylanBoleRss(
      SAMPLE_BOLE_WEEK_RSS,
      "2026-08-19",
    );
    expect(nonExistentItems.length).toBe(0);
  });

  it("handles empty or malformed XML gracefully", () => {
    expect(parseDylanBoleRss("", "2026-08-21")).toEqual([]);
    expect(
      parseDylanBoleRss("<rss><channel></channel></rss>", "2026-08-21"),
    ).toEqual([]);
  });
});
