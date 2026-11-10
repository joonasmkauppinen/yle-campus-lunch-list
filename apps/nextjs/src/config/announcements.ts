/**
 * A short note about something new in the app, shown in a dismissable box at
 * the top of the home page for two weeks after it is published.
 */
export interface Announcement {
  /** Stable id, stored in the browser when the user dismisses it */
  id: string;
  /** First day the announcement is shown (YYYY-MM-DD, Europe/Helsinki).
   * Set it to the day the change is deployed. */
  publishedAt: string;
  /** One short sentence, in Finnish */
  text: string;
}

/**
 * Announcements, newest first. Expired ones can be deleted at any time.
 */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "2026-11-fennia-and-piano",
    publishedAt: "2026-11-10",
    text: "Listalla ovat nyt myös Ninan Keittiö Fennia ja Ravintola Piano.",
  },
];
