import assert from "node:assert/strict";
import { describe, it } from "node:test";

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

void describe("dylan-bole fetcher", () => {
  void it("exports correct restaurant constants", () => {
    assert.equal(DYLAN_BOLE_RESTAURANT_ID, "dylan-bole");
    assert.equal(DYLAN_BOLE_RESTAURANT_NAME, "Dylan Böle");
    assert.equal(
      DYLAN_BOLE_DEFAULT_RSS_URL,
      "https://lounastaja.app/api/v1/rss/week/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/current?days=current&language=fi",
    );
  });

  void it("parseDylanBoleRss correctly extracts all menu items from sample RSS feed", () => {
    const items = parseDylanBoleRss(SAMPLE_BOLE_SINGLE_DAY_RSS, "2026-08-21");

    assert.equal(items.length, 6);

    const item0 = items[0];
    assert.ok(item0);
    assert.equal(item0.item, "Maapähkinävoilla höystetty kanakeitto");
    assert.deepEqual(item0.dietaryFlags, ["M", "G"]);
    assert.equal(item0.date, "2026-08-21");

    const item1 = items[1];
    assert.ok(item1);
    assert.equal(item1.item, "Meksikolainen kasvis pihvi & lime-hummus");
    assert.deepEqual(item1.dietaryFlags, ["V", "G"]);

    const item2 = items[2];
    assert.ok(item2);
    assert.equal(item2.item, "Naudan sisäfileetä punaviinikastikkeella");
    assert.deepEqual(item2.dietaryFlags, ["M", "G"]);

    const item3 = items[3];
    assert.ok(item3);
    assert.equal(
      item3.item,
      "Kermaista savulohi perunalaatikkoa ja kevätsipulia",
    );
    assert.deepEqual(item3.dietaryFlags, ["L", "G"]);

    const item4 = items[4];
    assert.ok(item4);
    assert.equal(item4.item, "Paahdettuja uunijuureksia & perunaa");
    assert.deepEqual(item4.dietaryFlags, ["V", "G"]);

    const item5 = items[5];
    assert.ok(item5);
    assert.equal(item5.item, "🧡Talon porkkanakakku");
    assert.deepEqual(item5.dietaryFlags, ["L"]);
  });

  void it("parseDylanBoleRss matches target date in multi-day feed", () => {
    const thursdayItems = parseDylanBoleRss(SAMPLE_BOLE_WEEK_RSS, "2026-08-20");
    assert.equal(thursdayItems.length, 3);
    const thu0 = thursdayItems[0];
    assert.ok(thu0);
    assert.equal(thu0.item, "Kermainen lohikeitto");
    assert.deepEqual(thu0.dietaryFlags, ["L", "G"]);

    const fridayItems = parseDylanBoleRss(SAMPLE_BOLE_WEEK_RSS, "2026-08-21");
    assert.equal(fridayItems.length, 6);
    const fri0 = fridayItems[0];
    assert.ok(fri0);
    assert.equal(fri0.item, "Maapähkinävoilla höystetty kanakeitto");

    const nonExistentItems = parseDylanBoleRss(
      SAMPLE_BOLE_WEEK_RSS,
      "2026-08-19",
    );
    assert.equal(nonExistentItems.length, 0);
  });

  void it("handles empty or malformed XML gracefully", () => {
    assert.deepEqual(parseDylanBoleRss("", "2026-08-21"), []);
    assert.deepEqual(
      parseDylanBoleRss("<rss><channel></channel></rss>", "2026-08-21"),
      [],
    );
  });
});
