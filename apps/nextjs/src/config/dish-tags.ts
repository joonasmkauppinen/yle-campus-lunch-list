import type { DishTagId } from "@acme/shared-types";
import { DISH_TAG_IDS } from "@acme/shared-types";

export interface DishTagConfig {
  /** Stable English id, as stored in the sheet by the scraper */
  id: DishTagId;
  /** Finnish text shown to the user, like the rest of the site */
  label: string;
  emoji: string;
}

/**
 * Display metadata for the Dish Tag vocabulary, kept beside the restaurant
 * config so the next person looks in the obvious place.
 *
 * Array order is grid order. The vocabulary itself and its overlap rules live
 * in `@acme/shared-types` and CONTEXT.md.
 */
export const DISH_TAG_CONFIGS: DishTagConfig[] = [
  { id: "meat", label: "Liha", emoji: "🥩" },
  { id: "chicken", label: "Kana", emoji: "🍗" },
  { id: "fish", label: "Kala", emoji: "🐟" },
  { id: "vegetarian", label: "Kasvis", emoji: "🌱" },
  { id: "vegan", label: "Vegaani", emoji: "🌿" },
  { id: "soup", label: "Keitto", emoji: "🍲" },
  { id: "salad", label: "Salaatti", emoji: "🥗" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "burger", label: "Burgeri", emoji: "🍔" },
  { id: "dessert", label: "Jälkiruoka", emoji: "🍰" },
  { id: "asian", label: "Aasialainen", emoji: "🍜" },
  { id: "indian", label: "Intialainen", emoji: "🍛" },
  { id: "italian", label: "Italialainen", emoji: "🍝" },
  { id: "tex-mex", label: "Tex Mex", emoji: "🌮" },
];

const CONFIG_BY_ID = new Map<DishTagId, DishTagConfig>(
  DISH_TAG_CONFIGS.map((config) => [config.id, config]),
);

export function getDishTagConfig(id: DishTagId): DishTagConfig | undefined {
  return CONFIG_BY_ID.get(id);
}

/** Every id in the vocabulary, for rejecting unrecognised sheet values. */
export const KNOWN_DISH_TAG_IDS = new Set<string>(DISH_TAG_IDS);
