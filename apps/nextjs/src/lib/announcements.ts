import type { Announcement } from "~/config/announcements";

/** How long an announcement is shown after it is published */
export const ANNOUNCEMENT_DURATION_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether the announcement is shown on the given day: from its publish date
 * for ANNOUNCEMENT_DURATION_DAYS days. Both dates are ISO (YYYY-MM-DD) days in
 * Europe/Helsinki, so plain UTC date arithmetic is exact.
 */
export function isAnnouncementActive(
  announcement: Announcement,
  todayIso: string,
): boolean {
  const published = Date.parse(announcement.publishedAt);
  const today = Date.parse(todayIso);
  if (Number.isNaN(published) || Number.isNaN(today)) return false;

  const daysSincePublished = (today - published) / DAY_MS;
  return (
    daysSincePublished >= 0 && daysSincePublished < ANNOUNCEMENT_DURATION_DAYS
  );
}

/**
 * The announcements to show today, newest first, leaving out expired,
 * not-yet-published and dismissed ones.
 */
export function getActiveAnnouncements(
  announcements: Announcement[],
  todayIso: string,
  dismissedIds: readonly string[] = [],
): Announcement[] {
  return announcements
    .filter(
      (announcement) =>
        isAnnouncementActive(announcement, todayIso) &&
        !dismissedIds.includes(announcement.id),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
