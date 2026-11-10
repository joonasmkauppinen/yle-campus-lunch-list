import { describe, expect, it } from "vitest";

import type { Announcement } from "~/config/announcements";

import { getActiveAnnouncements } from "./announcements";

function announcement(id: string, publishedAt: string): Announcement {
  return { id, publishedAt, text: id };
}

const ids = (list: Announcement[]) => list.map((a) => a.id);

describe("getActiveAnnouncements", () => {
  const all = [
    announcement("old", "2026-11-01"),
    announcement("new", "2026-11-10"),
  ];

  it("shows an announcement for two weeks from its publish date", () => {
    const single = [announcement("a", "2026-11-10")];
    expect(ids(getActiveAnnouncements(single, "2026-11-09"))).toEqual([]);
    expect(ids(getActiveAnnouncements(single, "2026-11-10"))).toEqual(["a"]);
    expect(ids(getActiveAnnouncements(single, "2026-11-23"))).toEqual(["a"]);
    expect(ids(getActiveAnnouncements(single, "2026-11-24"))).toEqual([]);
  });

  it("lists active announcements newest first", () => {
    expect(ids(getActiveAnnouncements(all, "2026-11-12"))).toEqual([
      "new",
      "old",
    ]);
  });

  it("leaves out dismissed announcements", () => {
    expect(ids(getActiveAnnouncements(all, "2026-11-12", ["new"]))).toEqual([
      "old",
    ]);
  });
});
