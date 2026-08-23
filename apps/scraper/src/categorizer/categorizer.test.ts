import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { categorizeLunchMenus, matchCategoriesByRules } from "./index.js";

void describe("matchCategoriesByRules", () => {
  void it("correctly identifies meat items", () => {
    assert.deepEqual(matchCategoriesByRules("Naudan lehtipihvi ja maustevoi"), [
      "liha",
    ]);
    assert.deepEqual(
      matchCategoriesByRules("Perinteiset lihapullat ja muusi"),
      ["liha"],
    );
    assert.deepEqual(
      matchCategoriesByRules("Porsaanleike bearnaisekastikkeella"),
      ["liha"],
    );
  });

  void it("correctly identifies fish items", () => {
    assert.deepEqual(
      matchCategoriesByRules("Paistettua lohta ja tilliperunoita"),
      ["kala"],
    );
    assert.deepEqual(matchCategoriesByRules("Kermaista kalakeittoa"), ["kala"]);
    assert.deepEqual(
      matchCategoriesByRules("Paneroitu seiti ja kermaviilikastike"),
      ["kala"],
    );
  });

  void it("correctly identifies chicken items", () => {
    assert.deepEqual(matchCategoriesByRules("Broilerinfileetä ja riisiä"), [
      "kana",
    ]);
    assert.deepEqual(matchCategoriesByRules("Crispy chicken burger"), [
      "kana",
      "burgeri",
    ]);
  });

  void it("correctly identifies vege and kasvis items without false meat matches", () => {
    const vegeMatches = matchCategoriesByRules("Tofuwok ja riisinuudelit");
    assert.ok(vegeMatches.includes("vege"));
    assert.ok(vegeMatches.includes("aasialainen"));
    assert.ok(!vegeMatches.includes("liha"));

    const kasvisMatches = matchCategoriesByRules("Kasvislasagne ja salaatti");
    assert.ok(kasvisMatches.includes("kasvis"));
    assert.ok(!kasvisMatches.includes("liha"));

    const harkisMatches = matchCategoriesByRules("Härkisbolognese");
    assert.ok(harkisMatches.includes("vege"));
    assert.ok(!harkisMatches.includes("liha"));
  });

  void it("correctly identifies pizza, burger, asian, and tex-mex dishes", () => {
    assert.ok(
      matchCategoriesByRules("Margherita pizza tuoreella basilikalla").includes(
        "pizza",
      ),
    );
    assert.ok(
      matchCategoriesByRules("Smash burger ja ranskalaiset").includes(
        "burgeri",
      ),
    );
    assert.ok(
      matchCategoriesByRules("Kana tikka masala ja basmatiriisi").includes(
        "aasialainen",
      ),
    );
    assert.ok(
      matchCategoriesByRules("Kana tikka masala ja basmatiriisi").includes(
        "kana",
      ),
    );
    assert.ok(
      matchCategoriesByRules("Kananpojan tacot ja pico de gallo").includes(
        "tex-mex",
      ),
    );
    assert.ok(
      matchCategoriesByRules("Kananpojan tacot ja pico de gallo").includes(
        "kana",
      ),
    );
  });
});

void describe("categorizeLunchMenus", () => {
  void it("aggregates menu items across restaurants and filters empty categories", async () => {
    const testData = [
      {
        restaurantId: "huoltamo",
        restaurantName: "Huoltamo",
        menus: [
          {
            date: "2026-08-24",
            item: "Lohikeitto",
            dietaryFlags: ["L", "G"],
          },
          {
            date: "2026-08-24",
            item: "Tofucurry",
            dietaryFlags: ["VEG", "G"],
          },
        ],
      },
      {
        restaurantId: "iso-paja",
        restaurantName: "Iso Paja",
        menus: [
          {
            date: "2026-08-24",
            item: "Pekoniburgeri",
            dietaryFlags: ["L"],
          },
        ],
      },
    ];

    const result = await categorizeLunchMenus(testData, "2026-08-24", false);

    assert.equal(result.date, "2026-08-24");
    assert.ok(result.categories.length > 0);

    const categoryIds = result.categories.map((c) => c.id);
    assert.ok(categoryIds.includes("kala"));
    assert.ok(categoryIds.includes("vege"));
    assert.ok(categoryIds.includes("aasialainen"));
    assert.ok(categoryIds.includes("burgeri"));
    assert.ok(categoryIds.includes("liha"));

    // Pizza wasn't in the menus, so it should be omitted
    assert.ok(!categoryIds.includes("pizza"));

    const fishCategory = result.categories.find((c) => c.id === "kala");
    assert.ok(fishCategory);
    assert.equal(fishCategory.items.length, 1);
    const firstFishItem = fishCategory.items[0];
    assert.ok(firstFishItem);
    assert.equal(firstFishItem.restaurantName, "Huoltamo");
    assert.equal(firstFishItem.item, "Lohikeitto");
  });
});
