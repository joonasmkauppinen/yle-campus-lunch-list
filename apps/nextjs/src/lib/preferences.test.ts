import { describe, expect, it } from "vitest";

import { resolveDishTagsVisibility } from "./preferences";

describe("resolveDishTagsVisibility", () => {
  it("shows the section whenever the switch is on", () => {
    expect(resolveDishTagsVisibility("visible", true)).toBe("visible");
    expect(resolveDishTagsVisibility("hidden", true)).toBe("visible");
    expect(resolveDishTagsVisibility("dismissed", true)).toBe("visible");
  });

  it("hides without the info box when turned off from settings", () => {
    expect(resolveDishTagsVisibility("visible", false)).toBe("dismissed");
  });

  it("keeps an already hidden state when the switch stays off", () => {
    // Saving the modal for an unrelated change must not dismiss an info box
    // the user has not closed yet.
    expect(resolveDishTagsVisibility("hidden", false)).toBe("hidden");
    expect(resolveDishTagsVisibility("dismissed", false)).toBe("dismissed");
  });
});
