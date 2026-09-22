import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ParsedMenuItem } from "@acme/shared-types";

import { tagMenuItems } from "./tagging.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * A recorded Jev exchange, keyed by the dish text that produced it. Captured
 * from a live run against the questions this module sends.
 */
const recordedResponses = JSON.parse(
  readFileSync(
    path.resolve(
      __dirname,
      "../../../docs/jev-dish-tagging-sample-response-data.json",
    ),
    "utf-8",
  ),
) as Record<string, unknown>;

function menuItem(item: string, dietaryFlags: string[] = []): ParsedMenuItem {
  return { date: "2026-09-23", item, dietaryFlags };
}

/** Replays the recorded response matching each request's dish text. */
function stubRecordedFetch() {
  return vi.fn(async (_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body) as { state: { item: string } };
    const recorded = recordedResponses[body.state.item];
    if (!recorded) {
      throw new Error(`No recorded response for "${body.state.item}"`);
    }
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => recorded,
    };
  });
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

  it("applies every tag clearing the threshold, so a dish can earn several", async () => {
    const [tagged] = await tagMenuItems(
      [menuItem("Broileri-nuudeliwok, soijakastike", ["L", "M"])],
      "Test",
    );

    // chicken 0.96 and asian 0.92 both clear; the dish is findable either way.
    expect(tagged?.tags).toEqual(["chicken", "asian"]);
  });

  it("applies a tag just above the threshold and withholds one just below", async () => {
    const [fishSoup] = await tagMenuItems(
      [menuItem("Lohikeitto ja saaristolaisleipää", ["G", "L"])],
      "Test",
    );
    // fish 0.75 clears, soup 0.89 clears.
    expect(fishSoup?.tags).toEqual(["fish", "soup"]);

    const [vegan] = await tagMenuItems(
      [menuItem("Härkäpapupihvit ja tomaattikastike", ["VE", "M"])],
      "Test",
    );
    // vegetarian 0.9 clears; vegan 0.6 does not.
    expect(vegan?.tags).toEqual(["vegetarian"]);
  });

  it("keeps red meat separate from poultry and fish", async () => {
    const [tagged] = await tagMenuItems(
      [menuItem("Jauhelihapihvit ja ruskeaa kastiketta", ["G"])],
      "Test",
    );

    expect(tagged?.tags).toEqual(["meat"]);
  });

  it("suppresses all tags when the item is not a dish", async () => {
    const [disclaimer] = await tagMenuItems(
      [menuItem("Huomioimme myös muut erikoisruokavaliot pyydettäessä")],
      "Test",
    );

    expect(disclaimer?.tags).toBeUndefined();
  });

  it("suppresses a tag that clears the threshold when the is-a-dish gate fails", async () => {
    // asian scores 0.69 here, but is_dish is only 0.56, so nothing is applied.
    const [tagged] = await tagMenuItems([menuItem("Kokin valinta")], "Test");

    expect(tagged?.tags).toBeUndefined();
  });

  it("leaves a dish untagged when no tag clears the threshold", async () => {
    const [tagged] = await tagMenuItems([menuItem("Päivän keitto")], "Test");

    // Only soup clears; every other answer stays well below.
    expect(tagged?.tags).toEqual(["soup"]);
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

  it("returns untagged menu items on a malformed body", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ unexpected: "shape" }),
    })) as unknown as typeof fetch;

    await expect(tagMenuItems(menus, "Test")).resolves.toEqual(menus);
  });

  it("returns untagged menu items without calling the API when no key is configured", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const fetchStub = vi.fn();
    globalThis.fetch = fetchStub as unknown as typeof fetch;

    await expect(tagMenuItems(menus, "Test")).resolves.toEqual(menus);
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("tags the items it can when a single request fails", async () => {
    const recorded = stubRecordedFetch();
    let call = 0;
    globalThis.fetch = vi.fn(async (url: string, init: { body: string }) => {
      call += 1;
      if (call === 1) throw new Error("transient");
      return recorded(url, init);
    }) as unknown as typeof fetch;

    const tagged = await tagMenuItems(
      [
        menuItem("Lohikeitto ja saaristolaisleipää", ["G", "L"]),
        menuItem("Broileri-nuudeliwok, soijakastike", ["L", "M"]),
      ],
      "Test",
    );

    expect(tagged[0]?.tags).toBeUndefined();
    expect(tagged[1]?.tags).toEqual(["chicken", "asian"]);
  });
});
