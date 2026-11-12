import type { DailyMenu, MenuItem } from "@acme/shared-types";
import { isIsoDate } from "@acme/shared-types";
import { parseDishTags } from "./dish-tags";

export function groupMenuRows(
  rows: unknown[][],
  statuses: unknown[][] = [],
  restaurantId?: string,
): DailyMenu[] {
  const days = new Map<string, MenuItem[]>();
  for (const row of rows) {
    const date = typeof row[2] === "string" ? row[2].trim() : "";
    const name = typeof row[3] === "string" ? row[3].trim() : "";
    if (!isIsoDate(date) || !name) continue;
    const items = days.get(date) ?? [];
    items.push({
      name,
      dietaryFlags:
        typeof row[4] === "string"
          ? row[4]
              .split(",")
              .map((flag) => flag.trim())
              .filter(Boolean)
          : [],
      tags: parseDishTags(typeof row[6] === "string" ? row[6] : ""),
    });
    days.set(date, items);
  }
  const menus = new Map<string, DailyMenu>(
    [...days].map(([date, items]) => [date, { date, items }]),
  );
  for (const row of statuses) {
    if (
      row[0] !== restaurantId ||
      typeof row[1] !== "string" ||
      !isIsoDate(row[1])
    )
      continue;
    const state = row[2];
    if (
      state !== "published" &&
      state !== "closed" &&
      state !== "unpublished" &&
      state !== "failed"
    )
      continue;
    const menu = menus.get(row[1]) ?? { date: row[1], items: [] };
    menus.set(row[1], {
      ...menu,
      availability: state,
      lastChecked: String(row[3] ?? ""),
      lastSuccess: String(row[4] ?? ""),
    });
  }
  return [...menus.values()].sort((a, b) => a.date.localeCompare(b.date));
}
