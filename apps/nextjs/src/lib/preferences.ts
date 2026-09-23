import type { Restaurant } from "@acme/shared-types";

export interface RestaurantPreferences {
  /** Ordered list of restaurant IDs */
  order: string[];
  /** List of hidden restaurant IDs */
  hidden: string[];
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
 * Applies saved preferences to the list of restaurants,
 * sorting them and partitioning into visible and hidden arrays.
 */
export function applyPreferencesToRestaurants(
  restaurants: Restaurant[],
  preferences: RestaurantPreferences | null,
): { visible: Restaurant[]; hidden: Restaurant[] } {
  if (!preferences) {
    return {
      visible: [...restaurants],
      hidden: [],
    };
  }

  const orderMap = new Map<string, number>();
  preferences.order.forEach((id, index) => {
    orderMap.set(id, index);
  });

  const hiddenSet = new Set(preferences.hidden);

  // Sort restaurants: prioritized by saved order, new ones kept at the end in their current order
  const sorted = [...restaurants].sort((a, b) => {
    const orderA = orderMap.get(a.id) ?? 9999;
    const orderB = orderMap.get(b.id) ?? 9999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return 0;
  });

  const visible: Restaurant[] = [];
  const hidden: Restaurant[] = [];

  for (const restaurant of sorted) {
    if (hiddenSet.has(restaurant.id)) {
      hidden.push(restaurant);
    } else {
      visible.push(restaurant);
    }
  }

  return { visible, hidden };
}
