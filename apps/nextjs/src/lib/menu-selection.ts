import type { Restaurant } from "@acme/shared-types";
import { getWeekDates } from "@acme/shared-types";

export function resolveMenuDate(
  requested: string | null,
  today: string,
): string {
  return requested && getWeekDates(today).includes(requested)
    ? requested
    : today;
}

export function selectRestaurantMenus(
  restaurants: Restaurant[],
  date: string,
): Restaurant[] {
  return restaurants.map((restaurant) => ({
    ...restaurant,
    menus: restaurant.menus.filter((menu) => menu.date === date),
  }));
}
