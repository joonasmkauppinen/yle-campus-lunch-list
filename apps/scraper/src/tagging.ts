import type { DishTagId, ParsedMenuItem } from "@acme/shared-types";
import { DISH_TAG_IDS } from "@acme/shared-types";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "deepseek/deepseek-v4.1-flash";

/** A restaurant's whole menu is one request; give up on it after this long. */
const REQUEST_TIMEOUT_MS = 60_000;

/**
 * What role a Menu Item plays on its menu. Only a `main` carries Dish Tags:
 * sides, breakfast and non-food lines are what made a tag like `vegetarian`
 * match nearly everything.
 */
const ITEM_KINDS = ["main", "side", "breakfast", "not_food"] as const;

/**
 * The instructions sent with every restaurant's menu. The tag definitions
 * encode the "narrower wins" overlap rules recorded in CONTEXT.md.
 */
const SYSTEM_PROMPT = `You tag the Finnish lunch menu of one campus restaurant in Helsinki, so that hungry office workers can find today's dishes by the kind of food they feel like eating.

You receive every line the restaurant published for the day, in order, with any dietary flags the restaurant printed next to it. Lines belong together: a main dish is often followed by its own lines for the rice, mash, sauce or vegetables served with it, and some restaurants print section headings such as "BUFFET MENU" or "VEGE MENU" between groups of lines. Read the whole menu before judging any single line.

For every line, return:
- "index": the line's number, exactly as given.
- "english": a short English translation of the line, to show your reading of it.
- "kind": one of
  - "main": something a diner would choose as their meal or course: a main dish, a soup, a salad served as a meal, a burger, a pizza, or a dessert or sweet course. A meal deal naming several courses is a main.
  - "side": an accompaniment to a main rather than a choice of its own: rice, potatoes, mash, fries, bread, a sauce, dressing, dip, jam, lingonberries, cooked vegetables or a side salad. A line that is only a potato, grain or vegetable and sits next to a main is a side, even when it carries a vegan flag.
  - "breakfast": porridge, a porridge bar or anything else served as breakfast.
  - "not_food": a heading, a price line, opening hours, an allergy or special-diet disclaimer, or any other text that is not food.
- "tags": Dish Tags for a "main". Always an empty list for any other kind.

Dish Tags. Apply a tag only when you are confident it is true; a wrong tag is much worse than a missing one, and a main with no tags is normal.
- "meat": red meat is a main ingredient: beef, pork, lamb, veal, reindeer, elk, game, or bacon, ham or sausage made from them. Not poultry and not fish.
- "chicken": chicken, turkey or other poultry is a main ingredient.
- "fish": fish or seafood is a main ingredient, including in a soup, salad or sauce.
- "vegetarian": a savoury main containing no meat, poultry, fish or seafood. Dairy, egg, cheese and honey are allowed.
- "vegan": a savoury main containing no animal products at all: no meat, fish, dairy, cheese, cream, butter, egg or honey. Every vegan main is also "vegetarian".
- "dessert": a dessert, cake, pastry, ice cream, kiisseli or other sweet course. A dessert carries no other tag: nearly every dessert is vegetarian, and listing them all under "vegetarian" would bury the vegetarian lunches.
- "soup": served as a soup. A dish in a sauce or gravy is not a soup, and neither is a porridge or a berry kiisseli.
- "salad": a salad substantial enough to be the meal.
- "pizza": a pizza, pizza slice or calzone.
- "burger": a burger served in a bun. A patty (pihvi) on a plate without a bun is not a burger.
- "asian": East or Southeast Asian: Chinese, Japanese, Korean, Thai, Vietnamese, such as a wok, noodles, ramen, teriyaki, hoisin, sweet and sour or a coconut curry. Not Indian.
- "indian": Indian or South Asian, such as tikka masala, korma, dal, naan or a dish with garam masala.
- "italian": Italian other than pizza: pasta, lasagne, risotto, gnocchi, or a classic Italian recipe such as parmigiana or saltimbocca. An Italian-language name alone is not enough: some restaurants name every dish in Italian, and a bean patty or a herb chicken stays untagged.
- "tex-mex": Mexican or Tex-Mex: taco, burrito, quesadilla, fajita, nachos, chili con carne, or a dish seasoned with taco spice ("taco maustettu").

Judging diets:
- Dietary flags are evidence but their meaning varies between restaurants, and a flag can describe only part of a line. Common ones: G gluten-free, L lactose-free, VL low-lactose, M milk-free, VEG / Veg / V / Ve / KASV vegetarian or vegan. A milk-free (M) flag alone does not make a dish vegan. A lactose-free (L) or low-lactose (VL) flag without M means the dish contains dairy, so it is not vegan. "Vegaaninen saatavilla" means a vegan version is available on request; the dish as listed is not vegan.
- The dish text wins over the flags: a "vegaaninen" (vegan) dish is vegan, and a dish naming cheese, cream, feta, mozzarella, halloumi, egg or butter is not vegan.
- "Kasvis" means vegetable and "kasvispihvi" is a vegetable patty; "härkäpapu", "mustapapu", "kikherne", "tofu", "soija", "Beyond" and "nyhtökaura" are plant proteins.
- When a line offers alternatives, such as "chicken / tofu filling", tag every alternative: a line with a chicken and a tofu option is both "chicken" and "vegetarian".`;

/** Output shape enforced through OpenRouter's structured outputs. */
const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "dish_tags",
    strict: true,
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              index: { type: "integer" },
              english: { type: "string" },
              kind: { type: "string", enum: ITEM_KINDS },
              tags: {
                type: "array",
                items: { type: "string", enum: DISH_TAG_IDS },
              },
            },
            required: ["index", "english", "kind", "tags"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
} as const;

interface ChatCompletionResponse {
  choices?: {
    message?: {
      content?: string | null;
    };
  }[];
}

interface TaggedLine {
  index?: unknown;
  kind?: unknown;
  tags?: unknown;
}

const KNOWN_TAG_IDS = new Set<string>(DISH_TAG_IDS);
const KNOWN_KINDS = new Set<string>(ITEM_KINDS);

/** Numbers each Menu Item so the model's answers can be matched back to it. */
function formatMenu(menus: ParsedMenuItem[]): string {
  return menus
    .map((menu, index) => {
      const flags =
        menu.dietaryFlags.length > 0
          ? ` [flags: ${menu.dietaryFlags.join(", ")}]`
          : "";
      return `${index}. ${menu.item}${flags}`;
    })
    .join("\n");
}

/**
 * Keeps only the tags a line may carry, enforcing the rules in CONTEXT.md even
 * when the model forgets them: none unless it is a main, only ids in the
 * vocabulary, nothing but `dessert` on a dessert, and `vegetarian` on every
 * vegan main.
 */
function selectTags(line: TaggedLine): DishTagId[] {
  if (line.kind !== "main" || !Array.isArray(line.tags)) {
    return [];
  }

  const tags = new Set(
    line.tags.filter(
      (tag): tag is DishTagId =>
        typeof tag === "string" && KNOWN_TAG_IDS.has(tag),
    ),
  );
  if (tags.has("dessert")) {
    return ["dessert"];
  }
  if (tags.has("vegan")) {
    tags.add("vegetarian");
  }

  // Vocabulary order, so the stored column is stable between runs.
  return DISH_TAG_IDS.filter((tagId) => tags.has(tagId));
}

/**
 * Asks the model to tag a restaurant's whole menu at once. Returns the tags
 * per Menu Item by position. Throws on any transport or shape problem; the
 * caller decides what an untagged menu looks like.
 */
async function requestTags(
  menus: ParsedMenuItem[],
  restaurantName: string,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<DishTagId[][]> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Restaurant: ${restaurantName}\n\n${formatMenu(menus)}`,
        },
      ],
      response_format: RESPONSE_FORMAT,
      // The English gloss is enough deliberation. Reasoning multiplied the
      // latency tenfold without tagging any better.
      reasoning: { enabled: false },
      // Route only to providers that honour the JSON schema.
      provider: { require_parameters: true },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Tagging request failed with status ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as ChatCompletionResponse;
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Tagging response did not contain a message");
  }

  const parsed = JSON.parse(content) as { items?: unknown };
  if (!Array.isArray(parsed.items)) {
    throw new Error("Tagging response did not contain an items array");
  }

  const tagsByIndex: DishTagId[][] = menus.map(() => []);
  for (const line of parsed.items as TaggedLine[]) {
    if (
      typeof line.index === "number" &&
      Number.isInteger(line.index) &&
      line.index >= 0 &&
      line.index < menus.length &&
      typeof line.kind === "string" &&
      KNOWN_KINDS.has(line.kind)
    ) {
      tagsByIndex[line.index] = selectTags(line);
    }
  }
  return tagsByIndex;
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

  let tagsByIndex: DishTagId[][];
  try {
    tagsByIndex = await requestTags(
      menus,
      restaurantName,
      apiKey,
      baseUrl,
      model,
    );
  } catch (error) {
    console.warn(
      `[Dish Tags] Could not tag ${restaurantName} menus. Writing them untagged:`,
      error,
    );
    return menus;
  }

  const tagged = menus.map((menu, index) => {
    const tags = tagsByIndex[index] ?? [];
    return tags.length > 0 ? { ...menu, tags } : menu;
  });

  const taggedCount = tagged.filter(
    (menu) => (menu.tags?.length ?? 0) > 0,
  ).length;
  console.log(
    `[Dish Tags] Tagged ${taggedCount}/${tagged.length} menu items for ${restaurantName}.`,
  );

  return tagged;
}
