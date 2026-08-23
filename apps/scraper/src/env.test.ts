import assert from "node:assert";
import { describe, it } from "node:test";

import { extractSpreadsheetId, sanitizeEnvValue } from "./env.js";

void describe("env sanitization and resolution", () => {
  void it("sanitizeEnvValue strips outer double and single quotes", () => {
    assert.strictEqual(sanitizeEnvValue(undefined), undefined);
    assert.strictEqual(sanitizeEnvValue(""), "");
    assert.strictEqual(sanitizeEnvValue('""'), "");
    assert.strictEqual(sanitizeEnvValue("''"), "");
    assert.strictEqual(
      sanitizeEnvValue('"https://example.com/menu"'),
      "https://example.com/menu",
    );
    assert.strictEqual(
      sanitizeEnvValue("'https://example.com/menu'"),
      "https://example.com/menu",
    );
    assert.strictEqual(
      sanitizeEnvValue('  "https://example.com/menu"  '),
      "https://example.com/menu",
    );
    assert.strictEqual(
      sanitizeEnvValue("https://example.com/menu"),
      "https://example.com/menu",
    );
  });

  void it("extractSpreadsheetId handles URLs and raw IDs with quotes", () => {
    assert.strictEqual(
      extractSpreadsheetId(
        '"https://docs.google.com/spreadsheets/d/1-AH4V4mMQQ60cHTJi28kF8M6sPEGlpAXjjn6rPqoFnM/edit"',
      ),
      "1-AH4V4mMQQ60cHTJi28kF8M6sPEGlpAXjjn6rPqoFnM",
    );
    assert.strictEqual(
      extractSpreadsheetId('"1-AH4V4mMQQ60cHTJi28kF8M6sPEGlpAXjjn6rPqoFnM"'),
      "1-AH4V4mMQQ60cHTJi28kF8M6sPEGlpAXjjn6rPqoFnM",
    );
  });
});
