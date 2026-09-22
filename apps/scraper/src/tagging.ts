import type { DishTagId, ParsedMenuItem } from "@acme/shared-types";
import { DISH_TAG_IDS } from "@acme/shared-types";

/**
 * A tag is applied when its probability clears this threshold.
 *
 * Deliberately strict: a wrong tag costs more than a missing one, because a
 * user who taps Kala and is shown chicken stops trusting the feature. Tune
 * here after seeing a week of real output.
 */
export const DISH_TAG_THRESHOLD = 0.7;

/** Question id for the gate deciding whether a Menu Item is a Dish at all. */
const IS_DISH_QUESTION_ID = "is_dish";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "typesafe/jev-1.13";

interface NoulQuestion {
  type: "noul";
  instructions: string;
  criteria: {
    true: string;
    false: string;
  };
}

/**
 * One yes/no question per Dish Tag, plus the is-a-Dish gate. The criteria
 * encode the "narrower wins" overlap rules recorded in CONTEXT.md.
 */
const QUESTIONS: Record<string, NoulQuestion> = {
  [IS_DISH_QUESTION_ID]: {
    type: "noul",
    instructions:
      "Is `item` the name of actual food being served, rather than a disclaimer, a section heading, a price notice or other non-food text printed on the same menu?",
    criteria: {
      true: "Something a diner could order and eat, such as a named dish, soup or salad",
      false:
        "A heading, an allergy or special-diet disclaimer, opening hours, a price line, or any other text that is not food",
    },
  },
  meat: {
    type: "noul",
    instructions:
      "Does `item` contain red meat — beef, pork, lamb, reindeer, game or sausage made from them?",
    criteria: {
      true: "Red meat is one of the main ingredients",
      false:
        "No red meat. Poultry-only and fish-only dishes count as false here, as do vegetarian dishes",
    },
  },
  chicken: {
    type: "noul",
    instructions: "Does `item` contain chicken, turkey or other poultry?",
    criteria: {
      true: "Poultry is one of the main ingredients",
      false: "No poultry",
    },
  },
  fish: {
    type: "noul",
    instructions:
      "Does `item` contain fish or seafood — salmon, whitefish, herring, tuna, shrimp, mussels and the like?",
    criteria: {
      true: "Fish or seafood is one of the main ingredients, including in a soup, salad or sauce",
      false: "No fish or seafood",
    },
  },
  vegetarian: {
    type: "noul",
    instructions:
      "Is `item` free of all meat, poultry and fish? Use `dietaryFlags` as evidence: restaurants mark vegetarian dishes with flags such as VEG, KASV or V, though the marking is not consistent between restaurants.",
    criteria: {
      true: "Contains no meat, poultry or fish. Dairy, egg, cheese and honey are allowed",
      false: "Contains meat, poultry or fish",
    },
  },
  vegan: {
    type: "noul",
    instructions:
      "Is `item` free of all animal products, including dairy, egg, cheese and honey as well as meat and fish? Use `dietaryFlags` as evidence: restaurants mark vegan dishes with flags such as VE, VEG or M, though the marking is not consistent between restaurants.",
    criteria: {
      true: "Contains no animal products at all",
      false:
        "Contains any animal product, including dairy, cheese, egg or honey. A vegetarian dish with halloumi or egg is false",
    },
  },
  soup: {
    type: "noul",
    instructions: "Is `item` a soup?",
    criteria: {
      true: "Served as a soup, broth or chowder",
      false: "Not a soup, even if it has a sauce or gravy",
    },
  },
  salad: {
    type: "noul",
    instructions: "Is `item` a salad served as a meal in its own right?",
    criteria: {
      true: "A salad substantial enough to be the meal",
      false: "Not a salad, or only a small side garnish alongside a main dish",
    },
  },
  pizza: {
    type: "noul",
    instructions: "Is `item` a pizza or a calzone?",
    criteria: {
      true: "A pizza, pizza slice or calzone",
      false: "Not a pizza",
    },
  },
  burger: {
    type: "noul",
    instructions: "Is `item` a burger served in a bun?",
    criteria: {
      true: "A hamburger, chicken burger or vegetarian burger in a bun",
      false:
        "Not a burger. A patty or pihvi served on a plate without a bun is false",
    },
  },
  dessert: {
    type: "noul",
    instructions: "Is `item` a dessert or something sweet?",
    criteria: {
      true: "A dessert, cake, pastry, ice cream, berry soup or other sweet course",
      false: "A savoury dish",
    },
  },
  asian: {
    type: "noul",
    instructions:
      "Is `item` East or Southeast Asian — Chinese, Japanese, Korean, Thai, Vietnamese?",
    criteria: {
      true: "Clearly East or Southeast Asian, such as a wok, curry with coconut milk, noodles, ramen, teriyaki or sweet and sour",
      false:
        "Not East or Southeast Asian. Indian dishes are false here; they have their own tag",
    },
  },
  indian: {
    type: "noul",
    instructions: "Is `item` Indian or South Asian?",
    criteria: {
      true: "Clearly Indian or South Asian, such as tikka masala, korma, dal, naan or a dish with garam masala",
      false: "Not Indian or South Asian",
    },
  },
  italian: {
    type: "noul",
    instructions:
      "Is `item` an Italian dish other than pizza — pasta, risotto, lasagne, gnocchi?",
    criteria: {
      true: "An Italian dish built on pasta, risotto or gnocchi",
      false: "Not Italian. Pizza is false here; it has its own tag",
    },
  },
  "tex-mex": {
    type: "noul",
    instructions: "Is `item` Mexican or Tex-Mex?",
    criteria: {
      true: "Clearly Mexican or Tex-Mex, such as a taco, burrito, quesadilla, fajita, nachos or chili con carne",
      false: "Not Mexican or Tex-Mex",
    },
  },
};

interface NoulAnswer {
  type?: string;
  noul?: number;
}

interface SystemOneResponse {
  answers?: Record<string, NoulAnswer | undefined>;
}

/**
 * Turns a model response's answers into the Dish Tags that clear the
 * threshold. The is-a-Dish gate suppresses every tag when it fails, so
 * disclaimers and section headers never reach the frontend.
 */
function selectTags(
  answers: Record<string, NoulAnswer | undefined>,
  threshold: number,
): DishTagId[] {
  const isDish = answers[IS_DISH_QUESTION_ID]?.noul;
  if (typeof isDish !== "number" || isDish < threshold) {
    return [];
  }

  return DISH_TAG_IDS.filter((tagId) => {
    const probability = answers[tagId]?.noul;
    return typeof probability === "number" && probability >= threshold;
  });
}

/**
 * Asks the model for one Menu Item's tags. Throws on any transport or shape
 * problem; the caller decides what an untagged item looks like.
 */
async function requestTags(
  menu: ParsedMenuItem,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<DishTagId[]> {
  const response = await fetch(`${baseUrl}/systemone`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      state: {
        item: menu.item,
        dietaryFlags: menu.dietaryFlags,
      },
      questions: QUESTIONS,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Tagging request failed with status ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as SystemOneResponse;
  if (!body.answers || typeof body.answers !== "object") {
    throw new Error("Tagging response did not contain an answers object");
  }

  return selectTags(body.answers, DISH_TAG_THRESHOLD);
}

/**
 * Tags a restaurant's Menu Items, returning them enriched with Dish Tags.
 *
 * Never throws and never rejects. The menus are the product and the tags are a
 * garnish: on a missing API key, a transport failure, a bad status or a
 * malformed body, the Menu Items come back untagged so the caller can still
 * write them to the sheet.
 */
export async function tagMenuItems(
  menus: ParsedMenuItem[],
  restaurantName: string,
): Promise<ParsedMenuItem[]> {
  if (menus.length === 0) {
    return menus;
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.warn(
      `[Dish Tags] OPENROUTER_API_KEY is not configured. Writing ${restaurantName} menus untagged.`,
    );
    return menus;
  }

  const baseUrl = (
    process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_BASE_URL
  ).replace(/\/+$/, "");
  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

  // One request per Dish, issued concurrently within a restaurant.
  const tagged = await Promise.all(
    menus.map(async (menu) => {
      try {
        const tags = await requestTags(menu, apiKey, baseUrl, model);
        return tags.length > 0 ? { ...menu, tags } : menu;
      } catch (error) {
        console.warn(`[Dish Tags] Could not tag "${menu.item}":`, error);
        return menu;
      }
    }),
  );

  const taggedCount = tagged.filter(
    (menu) => (menu.tags?.length ?? 0) > 0,
  ).length;
  console.log(
    `[Dish Tags] Tagged ${taggedCount}/${tagged.length} menu items for ${restaurantName}.`,
  );

  return tagged;
}
