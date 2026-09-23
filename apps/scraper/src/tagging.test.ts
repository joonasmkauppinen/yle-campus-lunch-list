import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ParsedMenuItem } from "@acme/shared-types";

import { tagMenuItems } from "./tagging.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface RecordedExchange {
  menus: ParsedMenuItem[];
  response: unknown;
}

/**
 * Recorded model exchanges, keyed by restaurant name: the menu that was sent
 * and the chat completion that came back. Captured from a live run against
 * the prompt this module sends.
 */
const recorded = JSON.parse(
  readFileSync(
    path.resolve(
      __dirname,
      "../../../docs/llm-dish-tagging-sample-response-data.json",
    ),
    "utf-8",
  ),
) as Record<string, RecordedExchange>;

function menuItem(item: string, dietaryFlags: string[] = []): ParsedMenuItem {
  return { date: "2026-09-23", item, dietaryFlags };
}

function okResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  };
}

/** A chat completion whose message is the given structured output. */
function completion(items: unknown[]) {
  return {
    choices: [{ message: { content: JSON.stringify({ items }) } }],
  };
}

/** Replays the recorded response for the restaurant named in the request. */
function stubRecordedFetch() {
  return vi.fn(async (_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body) as {
      messages: { content: string }[];
    };
    const exchange = Object.entries(recorded).find(([name]) =>
      body.messages.some((message) =>
        message.content.startsWith(`Restaurant: ${name}\n`),
      ),
    )?.[1];
    if (!exchange) {
      throw new Error("No recorded response for this restaurant");
    }
    return okResponse(exchange.response);
  });
}

/** Tags a recorded restaurant's menu and returns its tags keyed by dish text. */
async function tagRecorded(restaurantName: string) {
  const exchange = recorded[restaurantName];
  if (!exchange) throw new Error(`No recording for ${restaurantName}`);
  const tagged = await tagMenuItems(exchange.menus, restaurantName);
  return new Map(tagged.map((menu) => [menu.item, menu.tags]));
}

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENROUTER_API_KEY;

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = "test-key";
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.OPENROUTER_API_KEY = originalApiKey;
  vi.restoreAllMocks();
});

describe("tagMenuItems success path", () => {
  beforeEach(() => {
    globalThis.fetch = stubRecordedFetch() as unknown as typeof fetch;
  });

  it("tags each main by what it is", async () => {
    const tags = await tagRecorded("Huoltamo");

    expect(tags.get("Marry me chicken")).toEqual(["chicken"]);
    expect(tags.get("Paahdettua turskaa sitruuna-kapriskastikkeessa")).toEqual([
      "fish",
    ]);
    expect(tags.get("Palsternakkasosekeittoa")).toEqual(["vegetarian", "soup"]);
  });

  it("leaves the sides served with a main untagged", async () => {
    const huoltamo = await tagRecorded("Huoltamo");
    expect(huoltamo.get("Riisiä")).toBeUndefined();
    expect(huoltamo.get("Perunamuusia")).toBeUndefined();
    expect(huoltamo.get("Ruohosipuli-soijajogurttia")).toBeUndefined();

    const isoPaja = await tagRecorded("Iso Paja");
    // Flagged Ve, but mash is a side, not a vegan lunch.
    expect(isoPaja.get("Perunasosetta")).toBeUndefined();
    expect(isoPaja.get("Puolukkaa")).toBeUndefined();
  });

  it("leaves headings and breakfast untagged", async () => {
    const tags = await tagRecorded("Iso Paja");

    expect(tags.get("BUFFET MENU")).toBeUndefined();
    expect(tags.get("VEGE MENU")).toBeUndefined();
    expect(tags.get("AAMUPUURO")).toBeUndefined();
    expect(tags.get("Ruispuuroa")).toBeUndefined();
  });

  it("gives a vegan main both vegetarian and vegan", async () => {
    const tags = await tagRecorded("Huoltamo");

    expect(tags.get("Talon vegaanisia härkäpapu-punajuuripihvejä")).toEqual([
      "vegetarian",
      "vegan",
    ]);
  });

  it("tags every alternative a line offers", async () => {
    const tags = await tagRecorded("Piccolo");

    expect(
      tags.get(
        "Uuniperunoita cheddar-kana / valkosipuli-tofutäytteellä, sivusalaatin, kahvi sekä jälkiruoan kera",
      ),
    ).toEqual(["chicken", "vegetarian"]);
  });

  it("tags a dessert as a dessert only", async () => {
    const tags = await tagRecorded("Iso Paja");

    expect(tags.get("Karhunvatukkakiisseliä")).toEqual(["dessert"]);
  });
});

describe("tagMenuItems guards against the model", () => {
  const menus = [
    menuItem("Kasvislasagnea", ["L"]),
    menuItem("Riisiä", ["G"]),
    menuItem("Mustikkapiirakkaa", ["L"]),
  ];

  function stubCompletion(items: unknown[]) {
    globalThis.fetch = vi.fn(async () =>
      okResponse(completion(items)),
    ) as unknown as typeof fetch;
  }

  it("drops tags on anything but a main", async () => {
    stubCompletion([
      { index: 0, kind: "main", tags: ["italian"] },
      { index: 1, kind: "side", tags: ["vegetarian"] },
      { index: 2, kind: "not_food", tags: ["dessert"] },
    ]);

    const tagged = await tagMenuItems(menus, "Test");

    expect(tagged.map((menu) => menu.tags)).toEqual([
      ["italian"],
      undefined,
      undefined,
    ]);
  });

  it("adds vegetarian to a vegan main and strips other tags from a dessert", async () => {
    stubCompletion([
      { index: 0, kind: "main", tags: ["vegan", "italian"] },
      { index: 2, kind: "main", tags: ["vegetarian", "dessert"] },
    ]);

    const tagged = await tagMenuItems(menus, "Test");

    expect(tagged[0]?.tags).toEqual(["vegetarian", "vegan", "italian"]);
    expect(tagged[2]?.tags).toEqual(["dessert"]);
  });

  it("ignores unknown tags, unknown kinds and indexes outside the menu", async () => {
    stubCompletion([
      { index: 0, kind: "main", tags: ["italian", "lasagne"] },
      { index: 1, kind: "starter", tags: ["salad"] },
      { index: 7, kind: "main", tags: ["pizza"] },
    ]);

    const tagged = await tagMenuItems(menus, "Test");

    expect(tagged.map((menu) => menu.tags)).toEqual([
      ["italian"],
      undefined,
      undefined,
    ]);
  });
});

describe("tagMenuItems failure paths", () => {
  const menus = [menuItem("Lohikeitto ja saaristolaisleipää", ["G", "L"])];

  it("returns untagged menu items when the request throws", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    await expect(tagMenuItems(menus, "Test")).resolves.toEqual(menus);
  });

  it("returns untagged menu items on a non-success status", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(tagMenuItems(menus, "Test")).resolves.toEqual(menus);
  });

  it("returns untagged menu items on a body without a message", async () => {
    globalThis.fetch = vi.fn(async () =>
      okResponse({ unexpected: "shape" }),
    ) as unknown as typeof fetch;

    await expect(tagMenuItems(menus, "Test")).resolves.toEqual(menus);
  });

  it("returns untagged menu items when the message is not the expected JSON", async () => {
    globalThis.fetch = vi.fn(async () =>
      okResponse({ choices: [{ message: { content: "Sure! Here you go" } }] }),
    ) as unknown as typeof fetch;

    await expect(tagMenuItems(menus, "Test")).resolves.toEqual(menus);
  });

  it("returns untagged menu items without calling the API when no key is configured", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const fetchStub = vi.fn();
    globalThis.fetch = fetchStub as unknown as typeof fetch;

    await expect(tagMenuItems(menus, "Test")).resolves.toEqual(menus);
    expect(fetchStub).not.toHaveBeenCalled();
  });
});
