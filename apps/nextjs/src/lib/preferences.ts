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
