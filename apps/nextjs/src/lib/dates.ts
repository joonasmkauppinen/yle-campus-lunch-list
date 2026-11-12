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
 * Returns today's date in Europe/Helsinki as an ISO string (YYYY-MM-DD).
 */
export function getTodayIsoString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Checks whether a given menu date string matches today in Europe/Helsinki timezone.
 */
export function isCurrentDate(menuDate?: string): boolean {
  if (!menuDate) return false;

  const todayIso = getTodayIsoString();

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

/**
 * Resolves the opening/lunch hours string specifically for today (or a given date) in Europe/Helsinki.
 *
 * Examples:
 * - "Ma–pe 10.30–17.30, la–su 12.00–17.30"
 *   -> Monday–Friday: "10.30–17.30"
 *   -> Saturday–Sunday: "12.00–17.30"
 * - "Ma–pe 10.30–13.30"
 *   -> Monday–Friday: "10.30–13.30"
 *   -> Saturday–Sunday: "Suljettu"
 * - "24/7 (Itsepalvelu)"
 *   -> Any day: "24/7 (Itsepalvelu)"
 */
export function getOpeningHoursForCurrentDay(
  hoursStr?: string,
  date: Date = new Date(),
): string | null {
  if (!hoursStr) return null;
  const trimmed = hoursStr.trim();
  if (!trimmed) return null;

  // Always open cases
  if (/24\/7|24h/i.test(trimmed)) {
    return trimmed;
  }

  const dayNames = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const day = dayNames.indexOf(
    new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "Europe/Helsinki",
    })
      .format(date)
      .toLowerCase(),
  );
  const weekdays = ["ma", "ti", "ke", "to", "pe", "la", "su"];
  const schedules = [
    ...trimmed.matchAll(
      /\b(ma|ti|ke|to|pe|la|su)(?:\s*[-–—]\s*(ma|ti|ke|to|pe|la|su))?\s+([^,;]+)/gi,
    ),
  ];
  for (const schedule of schedules) {
    const first = weekdays.indexOf(schedule[1]?.toLowerCase() ?? "");
    const last = weekdays.indexOf(
      (schedule[2] ?? schedule[1] ?? "").toLowerCase(),
    );
    const matches =
      first <= last ? day >= first && day <= last : day >= first || day <= last;
    if (matches) {
      const value = schedule[3]?.trim() ?? "";
      if (/suljettu/i.test(value)) return "Suljettu";
      const time =
        /(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2}|\d{1,2}[.:]\d{2})/.exec(
          value,
        )?.[1];
      return time
        ? time.replace(/:/g, ".").replace(/\s*[-–—]\s*/g, "–")
        : value;
    }
  }
  if (schedules.length) return "Suljettu";
  if (/^(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2})$/.test(trimmed)) {
    return day >= 5
      ? "Suljettu"
      : trimmed.replace(/:/g, ".").replace(/\s*[-–—]\s*/g, "–");
  }
  return trimmed;
}
