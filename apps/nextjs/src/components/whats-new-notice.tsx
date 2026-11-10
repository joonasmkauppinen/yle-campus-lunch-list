"use client";

import { useSyncExternalStore } from "react";

import type { Announcement } from "~/config/announcements";
import { Notice } from "~/components/ui/notice";
import { getActiveAnnouncements } from "~/lib/announcements";
import { getTodayIsoString } from "~/lib/dates";
import {
  dismissStoredAnnouncements,
  getStoredDismissedAnnouncements,
  subscribeToPreferences,
} from "~/lib/preferences";

export interface WhatsNewNoticeProps {
  /** Every announcement in the config; this component picks the active ones */
  announcements: Announcement[];
}

/**
 * One dismissable box listing what is new in the app. Closing it dismisses
 * every announcement it shows.
 */
export function WhatsNewNotice({ announcements }: WhatsNewNoticeProps) {
  // Dismissals live in localStorage, so nothing renders on the server; the
  // box fades in once the client knows what the user has already closed.
  const dismissedString = useSyncExternalStore<string | null>(
    subscribeToPreferences,
    () => JSON.stringify(getStoredDismissedAnnouncements()),
    () => null,
  );

  if (dismissedString === null) return null;

  const active = getActiveAnnouncements(
    announcements,
    getTodayIsoString(),
    JSON.parse(dismissedString) as string[],
  );
  if (active.length === 0) return null;

  const handleDismiss = () =>
    dismissStoredAnnouncements(
      active.map((a) => a.id),
      announcements.map((a) => a.id),
    );

  return (
    <section aria-labelledby="whats-new-title" className="mb-8">
      <Notice
        title="Uutta"
        titleId="whats-new-title"
        variant="highlight"
        dismissLabel="Selvä"
        onDismiss={handleDismiss}
      >
        {active.length === 1 ? (
          <p>{active[0]?.text}</p>
        ) : (
          <ul className="list-disc space-y-0.5 pl-4">
            {active.map((announcement) => (
              <li key={announcement.id}>{announcement.text}</li>
            ))}
          </ul>
        )}
      </Notice>
    </section>
  );
}
