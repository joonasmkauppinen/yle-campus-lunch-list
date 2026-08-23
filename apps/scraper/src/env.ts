import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files in priority order (local overrides default)
const candidatePaths = [
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../../.env.development"),
  path.resolve(__dirname, "../../../.env.local"),
  path.resolve(__dirname, "../../../.env.development.local"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../.env.development"),
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../.env.development.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.development"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env.development.local"),
];

/**
 * Trims whitespace and strips matching surrounding single or double quotes if present.
 */
export function sanitizeEnvValue(val?: string): string | undefined {
  if (val === undefined) return undefined;
  let trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

// Sanitize all environment variables (crucial when passed via Docker --env-file which preserves outer quotes)
for (const key of Object.keys(process.env)) {
  const val = process.env[key];
  if (val !== undefined) {
    process.env[key] = sanitizeEnvValue(val);
  }
}

/**
 * Extracts a Google Spreadsheet ID from either a full Google Sheets URL
 * or a raw ID string.
 *
 * Example URLs:
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?gid=0#gid=0
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 * - 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 */
export function extractSpreadsheetId(input?: string): string | undefined {
  const sanitized = sanitizeEnvValue(input);
  if (!sanitized) return undefined;
  const trimmed = sanitized.trim();
  if (!trimmed) return undefined;

  const match = /\/d\/([a-zA-Z0-9-_]+)/.exec(trimmed);
  if (match?.[1]) {
    return match[1];
  }

  // If no URL pattern matched, treat as raw ID if it contains no slashes
  if (!trimmed.includes("/") && !trimmed.includes("http")) {
    return trimmed;
  }

  return trimmed;
}

export interface SpreadsheetResolution {
  spreadsheetId?: string;
  source?: string;
  isDev: boolean;
}

/**
 * Resolves the Google Sheets spreadsheet ID based on environment:
 * In development mode (NODE_ENV !== "production"), DEV_GOOGLE_SHEETS_URL / DEV_GOOGLE_SHEETS_ID takes precedence.
 */
export function getSpreadsheetResolution(): SpreadsheetResolution {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    const devUrlOrId =
      process.env.DEV_GOOGLE_SHEETS_URL ??
      process.env.GOOGLE_SHEETS_DEV_URL ??
      process.env.DEV_GOOGLE_SHEETS_ID ??
      process.env.GOOGLE_SHEETS_DEV_ID;

    if (devUrlOrId) {
      const parsedId = extractSpreadsheetId(devUrlOrId);
      if (parsedId) {
        const sourceName = process.env.DEV_GOOGLE_SHEETS_URL
          ? "DEV_GOOGLE_SHEETS_URL"
          : process.env.GOOGLE_SHEETS_DEV_URL
            ? "GOOGLE_SHEETS_DEV_URL"
            : process.env.DEV_GOOGLE_SHEETS_ID
              ? "DEV_GOOGLE_SHEETS_ID"
              : "GOOGLE_SHEETS_DEV_ID";
        return {
          spreadsheetId: parsedId,
          source: sourceName,
          isDev: true,
        };
      }
    }
  }

  const defaultUrlOrId =
    process.env.GOOGLE_SHEETS_ID ?? process.env.GOOGLE_SHEETS_URL;

  if (defaultUrlOrId) {
    const parsedId = extractSpreadsheetId(defaultUrlOrId);
    if (parsedId) {
      const sourceName = process.env.GOOGLE_SHEETS_ID
        ? "GOOGLE_SHEETS_ID"
        : "GOOGLE_SHEETS_URL";
      return {
        spreadsheetId: parsedId,
        source: sourceName,
        isDev,
      };
    }
  }

  return { isDev };
}

export interface OpeningHoursSpreadsheetResolution {
  spreadsheetId?: string;
  source?: string;
}

/**
 * Resolves the Google Sheets spreadsheet ID for Opening Hours.
 * Uses GOOGLE_SHEETS_OPENING_HOURS_ID or GOOGLE_SHEETS_OPENING_HOURS_URL.
 */
export function getOpeningHoursSpreadsheetResolution(): OpeningHoursSpreadsheetResolution {
  const urlOrId =
    process.env.GOOGLE_SHEETS_OPENING_HOURS_ID ??
    process.env.GOOGLE_SHEETS_OPENING_HOURS_URL;

  if (urlOrId) {
    const parsedId = extractSpreadsheetId(urlOrId);
    if (parsedId) {
      const sourceName = process.env.GOOGLE_SHEETS_OPENING_HOURS_ID
        ? "GOOGLE_SHEETS_OPENING_HOURS_ID"
        : "GOOGLE_SHEETS_OPENING_HOURS_URL";
      return {
        spreadsheetId: parsedId,
        source: sourceName,
      };
    }
  }

  return {};
}
