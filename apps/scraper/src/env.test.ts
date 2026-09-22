import { describe, expect, it } from "vitest";

import { extractSpreadsheetId, sanitizeEnvValue } from "./env.js";

describe("env sanitization and resolution", () => {
  it("sanitizeEnvValue strips outer double and single quotes", () => {
    expect(sanitizeEnvValue(undefined)).toBeUndefined();
    expect(sanitizeEnvValue("")).toBe("");
    expect(sanitizeEnvValue('""')).toBe("");
    expect(sanitizeEnvValue("''")).toBe("");
    expect(sanitizeEnvValue('"https://example.com/menu"')).toBe(
      "https://example.com/menu",
    );
    expect(sanitizeEnvValue("'https://example.com/menu'")).toBe(
      "https://example.com/menu",
    );
    expect(sanitizeEnvValue('  "https://example.com/menu"  ')).toBe(
      "https://example.com/menu",
    );
    expect(sanitizeEnvValue("https://example.com/menu")).toBe(
      "https://example.com/menu",
    );
  });

  it("extractSpreadsheetId handles URLs and raw IDs with quotes", () => {
    expect(
      extractSpreadsheetId(
        '"https://docs.google.com/spreadsheets/d/1-AH4V4mMQQ60cHTJi28kF8M6sPEGlpAXjjn6rPqoFnM/edit"',
      ),
    ).toBe("1-AH4V4mMQQ60cHTJi28kF8M6sPEGlpAXjjn6rPqoFnM");
    expect(
      extractSpreadsheetId('"1-AH4V4mMQQ60cHTJi28kF8M6sPEGlpAXjjn6rPqoFnM"'),
    ).toBe("1-AH4V4mMQQ60cHTJi28kF8M6sPEGlpAXjjn6rPqoFnM");
  });
});
