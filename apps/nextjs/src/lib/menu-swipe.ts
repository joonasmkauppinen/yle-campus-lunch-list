import { getWeekDates } from "@acme/shared-types";

/** Deliberate horizontal flicks change one day; scrolling and long drags do not. */
export function getSwipeDay(
  date: string,
  deltaX: number,
  deltaY: number,
  durationMs: number,
): string | null {
  if (
    durationMs > 700 ||
    durationMs < 0 ||
    Math.abs(deltaX) < 64 ||
    Math.abs(deltaX) < Math.abs(deltaY) * 1.5
  )
    return null;
  const dates = getWeekDates(date);
  return dates[dates.indexOf(date) + (deltaX < 0 ? 1 : -1)] ?? null;
}
