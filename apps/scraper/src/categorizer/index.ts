import type {
  CategoryMatchItem,
  DailyCategories,
  LunchCategory,
  ParsedMenuItem,
} from "@acme/shared-types";

import { categorizeWithOllama } from "./ollama.js";
import { CATEGORY_DEFINITIONS } from "./rules.js";

export interface RestaurantMenuAggregation {
  restaurantId: string;
  restaurantName: string;
  menus: ParsedMenuItem[];
}

/**
 * Matches a single menu item text and dietary flags against rule-based category patterns.
 */
export function matchCategoriesByRules(
  itemText: string,
  dietaryFlags: string[] = [],
): string[] {
  const normalizedText = itemText.toLowerCase();
  const matchedCategories: string[] = [];

  const isVeganDiet = dietaryFlags.some((flag) => {
    const f = flag.toUpperCase().trim();
    return f === "VEG" || f === "V" || f === "VEGAANI" || f === "VEGAANINEN";
  });

  for (const cat of CATEGORY_DEFINITIONS) {
    // 1. Check exclusions
    if (cat.exclude) {
      const isExcluded = cat.exclude.some((ex) => {
        if (typeof ex === "string") {
          return normalizedText.includes(ex.toLowerCase());
        }
        return ex.test(normalizedText);
      });
      if (isExcluded) {
        continue;
      }
    }

    // 2. Check keyword matches
    const isKeywordMatch = cat.keywords.some((pattern) => {
      if (typeof pattern === "string") {
        return normalizedText.includes(pattern.toLowerCase());
      }
      return pattern.test(normalizedText);
    });

    if (isKeywordMatch) {
      matchedCategories.push(cat.id);
      continue;
    }

    // 3. Fallback for vegan dietary flags if item has no conflicting non-veg tags
    if (
      (cat.id === "vege" || cat.id === "kasvis") &&
      isVeganDiet &&
      !matchedCategories.includes("liha") &&
      !matchedCategories.includes("kana") &&
      !matchedCategories.includes("kala")
    ) {
      matchedCategories.push(cat.id);
    }
  }

  return matchedCategories;
}

/**
 * Categorizes all scraped restaurant menus for the target date.
 * Uses Ollama (gemma4:e4b) if available, with deterministic fallback/enhancement.
 */
export async function categorizeLunchMenus(
  restaurantMenus: RestaurantMenuAggregation[],
  targetDate: string,
  useOllama = true,
): Promise<DailyCategories> {
  const allItemsToProcess: {
    restaurantId: string;
    restaurantName: string;
    item: string;
    dietaryFlags: string[];
  }[] = [];

  for (const restaurant of restaurantMenus) {
    for (const menu of restaurant.menus) {
      if (menu.date === targetDate && menu.item.trim().length > 0) {
        allItemsToProcess.push({
          restaurantId: restaurant.restaurantId,
          restaurantName: restaurant.restaurantName,
          item: menu.item.trim(),
          dietaryFlags: menu.dietaryFlags,
        });
      }
    }
  }

  // Attempt Ollama categorization if enabled
  let ollamaResults: Map<string, string[]> | null = null;
  if (useOllama) {
    const uniqueItemTexts = Array.from(
      new Set(allItemsToProcess.map((i) => i.item)),
    );
    if (uniqueItemTexts.length > 0) {
      ollamaResults = await categorizeWithOllama(uniqueItemTexts);
    }
  }

  const categoryMatchesMap = new Map<string, CategoryMatchItem[]>();
  for (const cat of CATEGORY_DEFINITIONS) {
    categoryMatchesMap.set(cat.id, []);
  }

  for (const entry of allItemsToProcess) {
    const ruleMatchedCatIds = matchCategoriesByRules(
      entry.item,
      entry.dietaryFlags,
    );
    const ollamaMatchedCatIds = ollamaResults?.get(entry.item) ?? [];

    const combinedCatIds = Array.from(
      new Set([...ruleMatchedCatIds, ...ollamaMatchedCatIds]),
    );

    for (const catId of combinedCatIds) {
      const list = categoryMatchesMap.get(catId);
      if (list) {
        // Prevent duplicate menu item per restaurant in the same category
        const alreadyExists = list.some(
          (m) => m.restaurantId === entry.restaurantId && m.item === entry.item,
        );
        if (!alreadyExists) {
          list.push({
            restaurantId: entry.restaurantId,
            restaurantName: entry.restaurantName,
            item: entry.item,
            dietaryFlags: entry.dietaryFlags,
          });
        }
      }
    }
  }

  const activeCategories: LunchCategory[] = [];
  for (const catDef of CATEGORY_DEFINITIONS) {
    const items = categoryMatchesMap.get(catDef.id) ?? [];
    if (items.length > 0) {
      activeCategories.push({
        id: catDef.id,
        label: catDef.label,
        icon: catDef.icon,
        items,
      });
    }
  }

  return {
    date: targetDate,
    lastUpdated: new Date().toISOString(),
    categories: activeCategories,
  };
}

export * from "./rules.js";
export * from "./ollama.js";
