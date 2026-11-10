import type { AreaId, Restaurant } from "@acme/shared-types";

import type { RestaurantArea } from "~/config/restaurants";
import { RESTAURANT_AREAS } from "~/config/restaurants";

export interface RestaurantPreferences {
  /** Ordered list of restaurant IDs. A restaurant never leaves its Area, so
   * this only sets the order within each Area. */
  order: string[];
  /** List of hidden restaurant IDs */
  hidden: string[];
  /** Ordered list of Area IDs. Absent in preferences saved before Areas. */
  areaOrder?: AreaId[];
  /** List of hidden Area IDs. Absent in preferences saved before Areas. */
  hiddenAreas?: AreaId[];
}

export const PREFERENCES_STORAGE_KEY = "restaurant-list-preferences";
export const PREFERENCES_CHANGE_EVENT = "restaurant-preferences-changed";

/**
 * Retrieves the stored restaurant preferences from localStorage.
 */
export function getStoredPreferences(): RestaurantPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RestaurantPreferences>;
    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      areaOrder: Array.isArray(parsed.areaOrder) ? parsed.areaOrder : [],
      hiddenAreas: Array.isArray(parsed.hiddenAreas) ? parsed.hiddenAreas : [],
    };
  } catch {
    return null;
  }
}

/**
 * Saves restaurant preferences to localStorage and dispatches a change event.
 */
export function setStoredPreferences(preferences: RestaurantPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    window.dispatchEvent(new Event(PREFERENCES_CHANGE_EVENT));
  } catch {
    // Silently handle error if storage is not accessible
  }
}

/**
 * Resets restaurant preferences in localStorage.
 */
export function resetStoredPreferences(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    window.dispatchEvent(new Event(PREFERENCES_CHANGE_EVENT));
  } catch {
    // Silently handle error
  }
}

/**
 * Whether the dish tags section is shown on the home page.
 *
 * - `visible`: the section is shown (default)
 * - `hidden`: the user hid the section from the page, and an info box in its
 *   place tells them how to bring it back
 * - `dismissed`: the section is hidden and the info box has been closed too
 */
export type DishTagsVisibility = "visible" | "hidden" | "dismissed";

export const DISH_TAGS_VISIBILITY_STORAGE_KEY = "dish-tags-visibility";

const DISH_TAGS_VISIBILITY_VALUES: readonly DishTagsVisibility[] = [
  "visible",
  "hidden",
  "dismissed",
];

/**
 * Retrieves the stored dish tags section visibility from localStorage,
 * defaulting to `visible` for missing or unrecognised values.
 */
export function getStoredDishTagsVisibility(): DishTagsVisibility {
  if (typeof window === "undefined") return "visible";
  try {
    const raw = localStorage.getItem(DISH_TAGS_VISIBILITY_STORAGE_KEY);
    return (
      DISH_TAGS_VISIBILITY_VALUES.find((value) => value === raw) ?? "visible"
    );
  } catch {
    return "visible";
  }
}

/**
 * Saves the dish tags section visibility and dispatches a change event, so
 * the page and the settings modal stay in sync.
 */
export function setStoredDishTagsVisibility(
  visibility: DishTagsVisibility,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISH_TAGS_VISIBILITY_STORAGE_KEY, visibility);
    window.dispatchEvent(new Event(PREFERENCES_CHANGE_EVENT));
  } catch {
    // Silently handle error if storage is not accessible
  }
}

/**
 * The visibility to store when the settings modal is saved with the
 * "show dish tags" switch in the given position.
 *
 * Turning the section off from settings skips the info box: the user is
 * already looking at the place they would re-enable it from. Leaving the
 * switch off keeps whatever hidden state was stored, so an info box the user
 * has not dismissed yet stays put.
 */
export function resolveDishTagsVisibility(
  current: DishTagsVisibility,
  show: boolean,
): DishTagsVisibility {
  if (show) return "visible";
  return current === "visible" ? "dismissed" : current;
}

export const DISMISSED_ANNOUNCEMENTS_STORAGE_KEY = "dismissed-announcements";

/**
 * Retrieves the ids of announcements the user has dismissed.
 */
export function getStoredDismissedAnnouncements(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Stores the given announcements as dismissed and dispatches a change event.
 * Only ids that still exist in `knownIds` are kept, so the list does not grow
 * forever as old announcements are deleted from the config.
 */
export function dismissStoredAnnouncements(
  ids: readonly string[],
  knownIds: readonly string[],
): void {
  if (typeof window === "undefined") return;
  try {
    const dismissed = new Set([...getStoredDismissedAnnouncements(), ...ids]);
    localStorage.setItem(
      DISMISSED_ANNOUNCEMENTS_STORAGE_KEY,
      JSON.stringify(knownIds.filter((id) => dismissed.has(id))),
    );
    window.dispatchEvent(new Event(PREFERENCES_CHANGE_EVENT));
  } catch {
    // Silently handle error if storage is not accessible
  }
}

/**
 * Subscribes to storage events and custom preference change events.
 */
export function subscribeToPreferences(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  window.addEventListener("storage", callback);
  window.addEventListener(PREFERENCES_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREFERENCES_CHANGE_EVENT, callback);
  };
}

/**
 * Heading for restaurants whose sheet tab has no config entry, and so no Area.
 */
export const OTHER_AREA_LABEL = "Muut";

export interface RestaurantAreaGroup {
  /** `null` for restaurants without an Area, always listed last */
  area: RestaurantArea | null;
  restaurants: Restaurant[];
}

/**
 * The Areas in the user's saved order. Areas missing from the saved order
 * (all of them, for preferences saved before Areas existed) keep their
 * default position after the saved ones.
 */
export function getOrderedAreas(
  preferences: RestaurantPreferences | null,
): RestaurantArea[] {
  const saved = preferences?.areaOrder ?? [];
  const rank = (area: RestaurantArea) => {
    const index = saved.indexOf(area.id);
    return index === -1 ? saved.length : index;
  };
  return [...RESTAURANT_AREAS].sort((a, b) => rank(a) - rank(b));
}

/**
 * Sorts restaurants by their saved position. Restaurants missing from the
 * saved order keep their incoming order after the saved ones.
 */
export function sortBySavedOrder<T extends { id: string }>(
  restaurants: T[],
  order: string[],
): T[] {
  const rank = (restaurant: T) => {
    const index = order.indexOf(restaurant.id);
    return index === -1 ? order.length : index;
  };
  return [...restaurants].sort((a, b) => rank(a) - rank(b));
}

/**
 * Applies saved preferences to the restaurants and groups the visible ones by
 * Area, in the user's Area order. Empty groups are left out. A restaurant is
 * hidden when the user hid it or its whole Area; hidden restaurants are
 * returned as one list in the same order they would have on the page.
 */
export function groupRestaurantsByArea(
  restaurants: Restaurant[],
  preferences: RestaurantPreferences | null,
): { groups: RestaurantAreaGroup[]; hidden: Restaurant[] } {
  const sorted = sortBySavedOrder(restaurants, preferences?.order ?? []);
  const hiddenIds = new Set(preferences?.hidden ?? []);
  const hiddenAreas = new Set(preferences?.hiddenAreas ?? []);

  const allGroups: { area: RestaurantArea | null; isHidden: boolean }[] = [
    ...getOrderedAreas(preferences).map((area) => ({
      area,
      isHidden: hiddenAreas.has(area.id),
    })),
    { area: null, isHidden: false },
  ];

  const groups: RestaurantAreaGroup[] = [];
  const hidden: Restaurant[] = [];

  for (const { area, isHidden } of allGroups) {
    const inArea = sorted.filter((restaurant) =>
      area ? restaurant.area === area.id : !restaurant.area,
    );
    const visible = inArea.filter(
      (restaurant) => !isHidden && !hiddenIds.has(restaurant.id),
    );
    hidden.push(
      ...inArea.filter((restaurant) => !visible.includes(restaurant)),
    );
    if (visible.length > 0) {
      groups.push({ area, restaurants: visible });
    }
  }

  return { groups, hidden };
}

/**
 * Applies saved preferences to the list of restaurants, in the order they
 * appear on the page, partitioned into visible and hidden arrays.
 */
export function applyPreferencesToRestaurants(
  restaurants: Restaurant[],
  preferences: RestaurantPreferences | null,
): { visible: Restaurant[]; hidden: Restaurant[] } {
  const { groups, hidden } = groupRestaurantsByArea(restaurants, preferences);
  return {
    visible: groups.flatMap((group) => group.restaurants),
    hidden,
  };
}
