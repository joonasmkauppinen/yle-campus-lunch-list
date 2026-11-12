import "./env.js";
import { fileURLToPath } from "node:url";
import { isIsoDate } from "@acme/shared-types";
import { getHelsinkiDateString } from "./fetchers/intra.js";
import { fetchAllOpeningHours } from "./fetchers/opening-hours.js";
import { updateGoogleSheetOpeningHours } from "./sheets.js";
import { triggerRevalidation } from "./revalidate.js";
import { createSourceFetcher, getSources, getWeekDates } from "./weekly.js";
import { createWeeklySync } from "./weekly-sync.js";
/**
 * Resolves the target scraping date (YYYY-MM-DD) from CLI flags, env variables, or today in Europe/Helsinki.
 *
 * Supported formats:
 * - CLI flags: --date 2026-08-21, --date=2026-08-21, -d 2026-08-21, -d=2026-08-21
 * - Positional argument: 2026-08-21
 * - Environment variables: TARGET_DATE, DATE, SCRAPE_DATE
 */
export function resolveTargetDate(
  argv: string[] = process.argv.slice(2),
): string {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--date" || arg === "-d") {
      const next = argv[i + 1];
      if (next && /^\d{4}-\d{2}-\d{2}$/.test(next)) {
        return next;
      }
    }
    if (arg.startsWith("--date=") || arg.startsWith("-d=")) {
      const val = arg.split("=")[1];
      if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return val;
      }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
      return arg;
    }
  }

  const envDate =
    process.env.TARGET_DATE ?? process.env.DATE ?? process.env.SCRAPE_DATE;

  if (envDate && /^\d{4}-\d{2}-\d{2}$/.test(envDate.trim())) {
    return envDate.trim();
  }

  return getHelsinkiDateString();
}

/**
 * Resolves whether dry run mode is enabled from CLI flags or environment variables.
 *
 * Supported formats:
 * - CLI flags: --dry-run, --dryrun, -n, --dry-run=true, --dry-run=false
 * - Environment variables: DRY_RUN (truthy values: "true", "1", "yes")
 */
export function resolveIsDryRun(
  argv: string[] = process.argv.slice(2),
): boolean {
  for (const arg of argv) {
    if (!arg) continue;

    if (arg === "--dry-run" || arg === "--dryrun" || arg === "-n") {
      return true;
    }
    if (arg.startsWith("--dry-run=") || arg.startsWith("--dryrun=")) {
      const val = arg.split("=")[1]?.toLowerCase().trim();
      return val === "true" || val === "1" || val === "yes";
    }
  }

  const envDryRun = process.env.DRY_RUN?.toLowerCase().trim();
  if (envDryRun) {
    return envDryRun === "true" || envDryRun === "1" || envDryRun === "yes";
  }

  return false;
}

export function resolveScrapeDates(argv: string[] = process.argv.slice(2)): {
  anchor: string;
  dates: string[];
} {
  const flagValue = (name: string) => {
    const equals = argv.find((arg) => arg.startsWith(`${name}=`));
    if (equals !== undefined) return equals.slice(name.length + 1);
    const index = argv.indexOf(name);
    return index >= 0 ? (argv[index + 1] ?? "") : undefined;
  };
  const weekArg = flagValue("--week");
  const singleArg =
    flagValue("--date") ??
    flagValue("-d") ??
    argv.find(
      (arg, index) =>
        argv[index - 1] !== "--week" && /^\d{4}-\d{2}-\d{2}$/.test(arg),
    );
  if (weekArg !== undefined && singleArg !== undefined)
    throw new Error("Use either --week or --date, not both");
  const envDate =
    process.env.TARGET_DATE ||
    process.env.DATE ||
    process.env.SCRAPE_DATE ||
    undefined;
  const anchor = weekArg ?? singleArg ?? envDate ?? getHelsinkiDateString();
  if (!isIsoDate(anchor)) throw new Error(`Invalid date: ${anchor}`);
  return {
    anchor,
    dates:
      weekArg !== undefined || (singleArg === undefined && !envDate)
        ? getWeekDates(anchor)
        : [anchor],
  };
}

async function main() {
  const { anchor, dates } = resolveScrapeDates();
  const dryRun = resolveIsDryRun();
  console.log(`Scraping ${dates.join(", ")}${dryRun ? " [DRY RUN]" : ""}`);
  const fetchSource = createSourceFetcher();
  const sync = await createWeeklySync(
    dryRun,
    process.argv.includes("--skip-tagging"),
  );
  let failures = 0;
  for (const source of getSources()) {
    try {
      const days = await fetchSource(source, dates);
      if (days.some((day) => day.state === "failed")) failures++;
      await sync(source, days, anchor);
    } catch (error) {
      failures++;
      console.error(`[${source.name}] Sync failed:`, error);
    }
  }
  try {
    await updateGoogleSheetOpeningHours(await fetchAllOpeningHours(), {
      dryRun,
    });
  } catch (error) {
    console.error("Opening hours failed:", error);
    failures++;
  }
  if (!dryRun) await triggerRevalidation();
  if (failures)
    throw new Error(
      `${failures} source/sync failures; other Restaurants were processed`,
    );
}
export { main };
const isMain =
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith("/index.ts") ||
    process.argv[1].endsWith("/index.js"));
if (isMain)
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
