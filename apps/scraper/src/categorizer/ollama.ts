import { CATEGORY_DEFINITIONS } from "./rules.js";

export interface OllamaCategorizeResult {
  item: string;
  categoryIds: string[];
}

/**
 * Categorizes menu items using a local Ollama instance (default model: gemma4:e4b).
 * Returns null if Ollama is not accessible, times out, or fails to parse.
 */
export async function categorizeWithOllama(
  items: string[],
  baseUrl: string = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  model: string = process.env.OLLAMA_MODEL ?? "gemma4:e4b",
  timeoutMs = 15000,
): Promise<Map<string, string[]> | null> {
  if (items.length === 0) {
    return new Map();
  }

  const categoryListStr = CATEGORY_DEFINITIONS.map(
    (c) => `- "${c.id}" (${c.label})`,
  ).join("\n");

  const prompt = `You are a Finnish restaurant lunch menu dish categorizer.
Categorize the following lunch menu items into one or more of these valid category IDs:
${categoryListStr}

Guidelines:
- Each item can have 0, 1, or more category IDs from the allowed list.
- Only use the allowed category IDs. Do NOT invent new categories.
- If an item doesn't fit any category, return an empty array for that item.
- Return ONLY valid JSON in the following format:
[
  { "item": "Dish name", "categories": ["category_id_1"] }
]

Items to categorize:
${JSON.stringify(items, null, 2)}`;

  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cleanBaseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(
        `[Ollama] Request failed with status ${res.status}: ${res.statusText}`,
      );
      return null;
    }

    const data = (await res.json()) as { response?: string };
    if (!data.response) {
      return null;
    }

    const validCategoryIds = new Set(CATEGORY_DEFINITIONS.map((c) => c.id));
    const parsed = JSON.parse(data.response) as
      | { item: string; categories?: string[] }[]
      | { items?: { item: string; categories?: string[] }[] };

    const list = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
    const resultMap = new Map<string, string[]>();

    for (const entry of list) {
      if (!entry.item) continue;
      const cats = (entry.categories ?? []).filter((c) =>
        validCategoryIds.has(c),
      );
      resultMap.set(entry.item.trim(), cats);
    }

    return resultMap;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(
      `[Ollama] Ollama categorization skipped or unavailable (${error instanceof Error ? error.message : String(error)}). Falling back to rule-based categorizer.`,
    );
    return null;
  }
}
