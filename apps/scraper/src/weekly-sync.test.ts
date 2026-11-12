import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import type { ParsedMenuItem } from "@acme/shared-types";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  batchGet: vi.fn(),
  batchUpdate: vi.fn(),
  tag: vi.fn(),
}));
vi.mock("googleapis", () => ({
  google: {
    sheets: () => ({
      spreadsheets: {
        get: mocks.get,
        batchUpdate: mocks.batchUpdate,
        values: { batchGet: mocks.batchGet },
      },
    }),
    auth: { JWT: vi.fn(function () {}) },
  },
}));
vi.mock("./env.js", () => ({
  getSpreadsheetResolution: () => ({ spreadsheetId: "test" }),
}));
vi.mock("./tagging.js", () => ({
  taggingVersion: () => "version",
  tagMenuItemsWithOutcome: mocks.tag,
}));
import { createWeeklySync, menuHash } from "./weekly-sync.js";

const source = { id: "huoltamo", name: "Huoltamo", url: "", parse: () => [] };
const item: ParsedMenuItem = {
  date: "2026-11-14",
  item: "Weekend soup",
  dietaryFlags: [],
};
const oldRow = [
  source.id,
  source.name,
  item.date,
  item.item,
  "",
  "old",
  "soup",
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "test@example.com");
  vi.stubEnv("GOOGLE_PRIVATE_KEY", "test-key");
  mocks.get.mockResolvedValue({
    data: {
      sheets: [
        { properties: { title: source.id, sheetId: 1 } },
        { properties: { title: "menu-status", sheetId: 2 } },
      ],
    },
  });
  mocks.batchGet.mockResolvedValue({
    data: { valueRanges: [{ values: [oldRow] }, { values: [] }] },
  });
  mocks.batchUpdate.mockResolvedValue({ data: {} });
  mocks.tag.mockImplementation(async (items: ParsedMenuItem[]) => ({
    items,
    success: true,
  }));
});
afterEach(() => vi.unstubAllEnvs());

function writtenRows(requestIndex: number): string[][] {
  const call = mocks.batchUpdate.mock.calls[0]?.[0];
  return call.requestBody.requests[requestIndex].updateCells.rows.map(
    (row: { values: { userEnteredValue: { stringValue: string } }[] }) =>
      row.values.map((cell) => cell.userEnteredValue.stringValue),
  );
}

describe("weekly Sheets synchronization", () => {
  it("reuses successful unchanged tagging, including zero-tag results", async () => {
    oldRow[6] = "";
    mocks.batchGet.mockResolvedValue({
      data: {
        valueRanges: [
          { values: [oldRow] },
          {
            values: [
              [
                source.id,
                item.date,
                "published",
                "old",
                "old",
                menuHash([item]),
                "version",
                "success",
              ],
            ],
          },
        ],
      },
    });
    const sync = await createWeeklySync(false);
    await sync(
      source,
      [{ date: item.date, state: "published", items: [item] }],
      item.date,
    );
    expect(mocks.tag).not.toHaveBeenCalled();
    expect(mocks.batchUpdate).toHaveBeenCalledTimes(1);
    expect(writtenRows(0)[1]).toEqual(oldRow);
    expect(writtenRows(1)[1]?.[7]).toBe("success");
  });
  it("tags changed days independently and writes rows + metadata in one batch", async () => {
    const changed = { ...item, item: "Changed soup" };
    const sync = await createWeeklySync(false);
    await sync(
      source,
      [
        { date: item.date, state: "published", items: [changed] },
        {
          date: "2026-11-15",
          state: "published",
          items: [{ ...item, date: "2026-11-15" }],
        },
      ],
      item.date,
    );
    expect(mocks.tag).toHaveBeenCalledTimes(2);
    expect(mocks.tag.mock.calls[0]?.[0]).toEqual([changed]);
    const batch = mocks.batchUpdate.mock.calls[0]?.[0].requestBody.requests;
    expect(batch).toHaveLength(2);
    expect(batch[0].updateCells).toMatchObject({
      fields: "userEnteredValue",
      range: { sheetId: 1, startRowIndex: 0 },
    });
    expect(
      writtenRows(0)
        .slice(1)
        .map((row) => row[2]),
    ).toEqual([item.date, "2026-11-15"]);
  });
  it("preserves last-good rows on failure and does not mark them fresh", async () => {
    const sync = await createWeeklySync(false);
    await sync(
      source,
      [{ date: item.date, state: "failed", items: [] }],
      item.date,
    );
    expect(writtenRows(0)[1]).toEqual(oldRow);
    expect(writtenRows(1)[1]?.[2]).toBe("failed");
    expect(writtenRows(1)[1]?.[4]).toBe("old");
  });
  it("never calls Sheets or AI in a dry run with tagging skipped", async () => {
    const sync = await createWeeklySync(true, true);
    await sync(
      source,
      [{ date: item.date, state: "published", items: [item] }],
      item.date,
    );
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.batchGet).not.toHaveBeenCalled();
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
    expect(mocks.tag).not.toHaveBeenCalled();
  });
});
