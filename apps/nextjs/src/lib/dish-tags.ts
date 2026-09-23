import type { DishTagId, MenuItem, Restaurant } from "@acme/shared-types";

import type { DishTagConfig } from "~/config/dish-tags";
import { DISH_TAG_CONFIGS, KNOWN_DISH_TAG_IDS } from "~/config/dish-tags";

/** A tag that matches at least one Dish today, with its match count. */
export interface AvailableDishTag {
  config: DishTagConfig;
  count: number;
}

/** The Dishes one restaurant is serving that match the selected tag. */
export interface DishTagGroup {
  restaurantId: string;
  restaurantName: string;
  items: MenuItem[];
}

/**
 * Parses the sheet's comma-separated tags column into known Dish Tag ids.
 *
 * Tolerates a missing or empty column and silently drops ids outside the
 * vocabulary, so removing a tag does not break the page before the sheet is
 * rewritten.
 */
export function parseDishTags(raw: string | undefined | null): DishTagId[] {
  if (!raw) {
    return [];
  }

  const seen = new Set<string>();
  const tags: DishTagId[] = [];

  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (!id || seen.has(id) || !KNOWN_DISH_TAG_IDS.has(id)) {
      continue;
    }
    seen.add(id);
    tags.push(id as DishTagId);
  }

  return tags;
}

/** Every Menu Item across the given restaurants, in restaurant order. */
function allItems(restaurants: Restaurant[]): MenuItem[] {
  return restaurants.flatMap((restaurant) =>
    restaurant.menus.flatMap((menu) => menu.items),
  );
}

/**
 * The tags worth rendering: those matching at least one Dish today, in
 * configured order, each with how many Dishes it matches.
 *
 * A tag nobody is serving is absent rather than empty, so every button on the
 * page leads somewhere.
 */
export function getAvailableDishTags(
  restaurants: Restaurant[],
): AvailableDishTag[] {
  const counts = new Map<DishTagId, number>();

  for (const item of allItems(restaurants)) {
    for (const tag of item.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return DISH_TAG_CONFIGS.filter((config) => counts.has(config.id)).map(
    (config) => ({ config, count: counts.get(config.id) ?? 0 }),
  );
}

/**
 * The Dishes matching one tag, grouped by the restaurant serving them.
 *
 * Restaurants keep the order they arrive in — the same order as the main list
 * — and restaurants with no match are omitted.
 */
export function getDishesForTag(
  restaurants: Restaurant[],
  tagId: DishTagId,
): DishTagGroup[] {
  const groups: DishTagGroup[] = [];

  for (const restaurant of restaurants) {
    const items = restaurant.menus
      .flatMap((menu) => menu.items)
      .filter((item) => item.tags?.includes(tagId));

    if (items.length > 0) {
      groups.push({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        items,
      });
    }
  }

  return groups;
}
