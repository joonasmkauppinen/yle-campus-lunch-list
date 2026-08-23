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

  // Get current day of week in Helsinki (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const helsinkiDay = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Europe/Helsinki",
  })
    .format(date)
    .toLowerCase(); // 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'

  const isWeekend = helsinkiDay === "sat" || helsinkiDay === "sun";
  const isSaturday = helsinkiDay === "sat";
  const isSunday = helsinkiDay === "sun";

  // Check if string contains comma-separated parts like "Ma–pe 10.30–17.30, la–su 12.00–17.30"
  const parts = trimmed.split(/,\s*/);
  for (const part of parts) {
    const cleanPart = part.trim();

    if (isWeekend) {
      if (
        /la\s*[-–—]\s*su/i.test(cleanPart) ||
        (isSaturday && /\bla\b/i.test(cleanPart)) ||
        (isSunday && /\bsu\b/i.test(cleanPart))
      ) {
        const timeMatch =
          /(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2}|\d{1,2}[.:]\d{2})/.exec(
            cleanPart,
          );
        if (timeMatch?.[1]) {
          return timeMatch[1].replace(/:/g, ".").replace(/\s*[-–—]\s*/g, "–");
        }
        return cleanPart;
      }
    } else {
      if (
        /ma\s*[-–—]\s*pe/i.test(cleanPart) ||
        /ark/i.test(cleanPart) ||
        (helsinkiDay === "mon" && /\bma\b/i.test(cleanPart)) ||
        (helsinkiDay === "tue" && /\bti\b/i.test(cleanPart)) ||
        (helsinkiDay === "wed" && /\bke\b/i.test(cleanPart)) ||
        (helsinkiDay === "thu" && /\bto\b/i.test(cleanPart)) ||
        (helsinkiDay === "fri" && /\bpe\b/i.test(cleanPart))
      ) {
        const timeMatch =
          /(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2}|\d{1,2}[.:]\d{2})/.exec(
            cleanPart,
          );
        if (timeMatch?.[1]) {
          return timeMatch[1].replace(/:/g, ".").replace(/\s*[-–—]\s*/g, "–");
        }
        return cleanPart;
      }
    }
  }

  // If only weekday hours were specified (e.g. "Ma–pe 10.30–13.30") and today is weekend:
  if (
    isWeekend &&
    /ma\s*[-–—]\s*pe/i.test(trimmed) &&
    !/la|su|viikonlopp/i.test(trimmed)
  ) {
    return "Suljettu";
  }

  // If weekday and the whole string is just "Ma–pe 10.30–13.30"
  if (!isWeekend && /ma\s*[-–—]\s*pe/i.test(trimmed)) {
    const timeMatch = /(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2})/.exec(
      trimmed,
    );
    if (timeMatch?.[1]) {
      return timeMatch[1].replace(/:/g, ".").replace(/\s*[-–—]\s*/g, "–");
    }
  }

  // If it's a raw time range like "10.30–14.00"
  const plainTimeMatch = /^(\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2})$/.exec(
    trimmed,
  );
  if (plainTimeMatch?.[1]) {
    if (isWeekend) {
      return "Suljettu";
    }
    return plainTimeMatch[1].replace(/:/g, ".").replace(/\s*[-–—]\s*/g, "–");
  }

  return trimmed;
}
