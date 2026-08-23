/**
 * Returns today's date formatted in Finnish (e.g. "SUNNUNTAI 23.8.2026").
 */
export function getTodayFormattedString(date: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat("fi-FI", {
    weekday: "long",
    timeZone: "Europe/Helsinki",
  })
    .format(date)
    .toUpperCase();

  const dateNumeric = new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Europe/Helsinki",
  }).format(date);

  return `${weekday} ${dateNumeric}`;
}

/**
 * Checks whether a given menu date string matches today in Europe/Helsinki timezone.
 */
export function isCurrentDate(menuDate?: string): boolean {
  if (!menuDate) return false;

  const todayIso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (menuDate === todayIso) return true;

  const todayFi = new Intl.DateTimeFormat("fi-FI", {
    timeZone: "Europe/Helsinki",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date());

  if (menuDate === todayFi) return true;

  return false;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into Finnish display format (D.M.YYYY).
 */
export function formatDisplayDate(dateStr: string): string {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (isoMatch?.[1] && isoMatch[2] && isoMatch[3]) {
    const day = parseInt(isoMatch[3], 10);
    const month = parseInt(isoMatch[2], 10);
    const year = isoMatch[1];
    return `${day}.${month}.${year}`;
  }
  return dateStr;
}
