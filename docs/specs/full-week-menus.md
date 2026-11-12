# Full week lunch menus — implementation plan

Issue: https://github.com/joonasmkauppinen/yle-campus-lunch-list/issues/70

Status: implementation started; date-tab UI agreed on 12 November 2026.
No production writes or deployment changes authorized.
Source investigation: 11 November 2026.

## Product scope and recommended defaults

All 12 configured Restaurants expose every published menu for the current
Helsinki calendar week on both `/` and `/restaurant/[id]`. A week is Monday
through Sunday. Most restaurants publish only weekdays; unpublished days must
never be filled by copying another day's menu. Next-week browsing and historical
archives are outside the first release.

Place horizontal date tabs below the main page title. On Restaurant pages,
place the tabs below the Restaurant information (address and opening hours) and
immediately above the menu list,
using labels `Ma 9.11.`, `Ti 10.11.`, `Ke 11.11.`, through `Su 15.11.`.
Select today on a fresh visit. Include Saturday and Sunday: Huoltamo usually
serves lunch on weekends. Preserve the existing page/card layout; selecting a
date switches the menus, opening hours and AI Dish Tag suggestions together.
There is no day/week view switch or expanded weekly layout.

## Findings in the current implementation

- The issue body currently says only `TODO needs specs`.
- `ParsedMenuItem.date`, the Sheets date column, and `Restaurant.menus:
  DailyMenu[]` already support multiple dates structurally.
- Fetchers currently select one target date. Most underlying payloads already
  contain several days; they should be fetched once and parsed for the week.
- `apps/scraper/src/sheets.ts` clears every data row in a Restaurant tab before
  writing the day's rows. Repeated per-day writes would leave only the last day.
- `apps/nextjs/src/lib/sheets.ts` combines all rows into one DailyMenu using the
  first row's date. This must be fixed before publishing multi-date rows.
- Restaurant cards and detail pages use `menus[0]` and compare it with today.
  Future menus would incorrectly appear as old menus.
- `apps/nextjs/src/lib/dish-tags.ts` flattens every menu without date filtering.
  Simply adding weekly rows would mix different days in the filter results.
- Tagging currently sends one restaurant's entire daily menu in one request.
  `formatMenu` does not include dates. Passing a whole week into it would mix
  context between days, particularly main/side relationships.
- README describes daily scraping; `docs/SPECS.md` describes cron on Unraid.
  The Docker image executes the scraper once. The checked-in GitHub workflow
  builds/publishes the image and does not schedule scraping. The actual deployed
  cron time and frequency need checking on Unraid.

## 1. Sources and weekly ingestion

### Confirmed RSS sources

These URLs were fetched directly and their returned item dates checked:

- Dylan Luft: https://lounastaja.app/api/v1/rss/week/5843f3ec-6a2c-49ba-ba3e-b384f6c996f1/current?language=fi
- Dylan Böle: https://lounastaja.app/api/v1/rss/week/3aba0b64-0d43-41ea-b665-1d2d6c0f2d5e/current?language=fi
- Dylan La Ilma: https://lounastaja.app/api/v1/rss/week/70835b81-ec1f-443f-92bb-9832d21fb3af/current?language=fi
- Pasilan Linkki: https://www.compass-group.fi/menuapi/feed/rss/current-week?costNumber=3642&language=fi

All three Dylan feeds returned dated Monday–Friday items for 9–13 November
2026. Remove `days=current`; `days=all` was tested and returned HTTP 400.
Linkki returned dated Monday–Sunday items for 9–15 November. Its endpoint
initially returned HTTP 403; a request with a browser User-Agent and explicit
Accept header succeeded. Include a compatible User-Agent in the fetcher and
verify from the deployed runtime. Returned days alone do not prove that lunch
is served on every day; inspect the descriptions and closed-day markers too.

### Other sources

- Huoltamo, Piccolo and Studio 10: shared Intra JSON API; iterate all entries
  for each restaurant in the requested week instead of finding one date.
  The checked-in fixture contains multiple weeks. The live API was also checked:
  all three restaurants included 9–13 November 2026 after converting dates
  to Europe/Helsinki.
- Iso Paja, Akseli, Päättäri, Fennia and Piano: retain HTML sources and existing
  dish-line parsing. Collect every dated day block in range. Fennia already
  exposes ISO dates on buttons; the other sites use dated headings. Live pages
  were fetched: all five contained Monday–Friday sections; dated headings for
  this week were checked, including Piano’s 9.11–13.11 headings. Full parser
  validation and closure handling remain implementation work.
- Where headings omit a year, infer the year relative to the requested week,
  including December/January rollover. A weekday name by itself is insufficient
  evidence that an old page belongs to the current week.

### Fetcher contract and orchestration

1. Add shared, tested date-only helpers for the Monday/Sunday range containing
   a Helsinki date. Avoid adding fixed 24-hour milliseconds across DST changes.
2. Default the CLI to the week containing today. Keep `--date` as an explicit
   single-day compatibility mode and add `--week YYYY-MM-DD` for the containing
   week; reject conflicting flags. Document that a current-week feed cannot
   necessarily supply an arbitrary requested historical week.
3. Fetch each URL once per run, including one shared Intra request. Parse all
   in-range dates while retaining original line order within each day.
4. Return dated menus plus per-day availability information, rather than only
   a flat array that cannot distinguish an empty valid day from a parser failure.
5. Distinguish published menus, explicit closure, not-yet-published/unknown
   dates, and fetch/parse failure. Treat a structurally unrecognizable response
   as failure, not as an authoritative empty week.
6. Remove RSS fallbacks that assign undated content to the requested date.
   Prefer the menu's explicit date; use publication timestamps only where the
   source's semantics have been verified.
7. Aggregate the week before syncing. A single-day CLI run must merge that day
   into the current stored week rather than erase the other dates.
8. Keep failures isolated by Restaurant, including the tagging/write phase for
   each Intra restaurant; the current shared Intra try/catch is too broad.
9. Update default RSS URLs, environment examples, deployment overrides and
   documentation. Existing environment overrides can otherwise keep selecting
   today's feed even after defaults change. Warn on known daily-only URLs.

## 2. Google Sheets storage and failure behavior

Retain one tab per Restaurant and the existing seven columns:
`restaurantId`, `restaurantName`, `date`, `item`, `dietaryFlags`, `lastUpdated`,
`tags`. Store one row per Menu Item, with multiple dates in each tab. No new
spreadsheet, weekday columns, or per-day Restaurant tabs are needed.

Keep only the active week's data after a successful weekly refresh. This is a
weekly Menu Snapshot, not a history feature. Update CONTEXT.md accordingly.
Old data left behind after failure must never be presented as the new week's
menu.

Add a small `menu-status` tab keyed by `(restaurantId, date)` for information
that cannot live on a Menu Item row when a day has no items:

- availability (`published`, `closed`, `unpublished`), last successful check,
  last attempted check, and latest fetch outcome;
- ordered menu-content hash, tagging version and tagging outcome, supporting
  safe reuse and retries of AI results.

Before adding this tab, change the frontend reader to read configured Restaurant
tabs explicitly. Today it treats every tab as a Restaurant. Metadata must not
surface as a phantom restaurant or break the legacy API. Missing configured
tabs should produce a known Restaurant with unavailable menus.

Reconciliation rules:

- A successfully parsed, published day replaces that day's rows, including
  removing dishes that disappeared. Explicit closure removes that day's rows.
- A failed fetch/parse preserves the last good data for that date and records
  failure/freshness separately. A temporary missing day may retain previously
  published data with a visible freshness warning. Never silently call it fresh.
- A day with no previous data is unavailable, not closed, unless the source
  explicitly says it is closed. Never guess closure from an empty array.
- Successful tagging with zero tags is valid. Distinguish it from tagging
  failure so empty tags do not cause endless retries.
- Write the reconciled Restaurant rows and day metadata together using an
  atomic Sheets `spreadsheets.batchUpdate` with cell updates. Include clearing
  obsolete trailing rows in that same batch. Remove clear-then-write behavior,
  which can leave a blank tab if the second request fails.
- Prevent overlapping scheduled/manual writers with a deployment lock; compare
  before writing, and skip unchanged data writes except necessary status updates.

Group frontend rows by their own date, sort DailyMenus chronologically, and
carry day-level availability/freshness into the shared model. Do not manufacture
`lastUpdated = now` for empty or missing data. Keep the existing row tag column;
this follows ADR 0001 rather than introducing text-based joins.

## 3. Main page and Restaurant page UI

Use the same week/date navigation and menu-selection utilities on both routes.
Keep page data loading on the server and isolate interactive controls in small
client components. The bounded weekly dataset can be loaded once, with view
changes performed locally and synchronized to the URL; changing a day must not
trigger another Google Sheets read.

- Seven horizontal date tabs sit below the main page title. On Restaurant
  pages they sit below all Restaurant information and above the menu list.
  Use the exact capitalized Finnish abbreviation and date format `Ma 9.11.`.
  Mark the selected tab and today, support keyboard navigation, and scroll the
  row horizontally on narrow screens with the selected day brought into view.
- On mobile touch screens (viewport below 768px with a coarse primary pointer),
  swipe left/right over menu content to move one day forward/backward. Do not
  wrap beyond Monday/Sunday. Preserve vertical scrolling, pinch zoom, native
  browser edge gestures and nested scrolling/interactive controls. The tab row
  scrolls horizontally rather than interpreting swipes as day changes. Selecting
  a day keeps its tab visible without changing the page's vertical position.
- Default to today, including weekends. Missing content has an empty state;
  do not silently jump to Monday or display Friday as today's menu.
- Keep existing Area grouping, cards, ordering, hidden preferences and detail
  page layout. Selecting a tab replaces only the selected-day content.
- Persist the selected date in `?date=2026-11-12`; preserve it in Restaurant
  links, Dish Tag links and the return link. Fresh visits without a date default
  to today. Invalid/out-of-week dates resolve to today.
- Render `Suljettu` only for known closure, `Ruokalistaa ei ole vielä julkaistu`
  for unavailable content, and a freshness warning for retained data after a
  failed refresh. Future menus are valid; remove the rule that every non-today
  menu is an old menu.
- Opening hours must correspond to the selected/menu date, not today's weekday.
  General weekly opening hours are not proof of holiday opening hours.
- Keep date selection, visible menus and Dish Tag results under one shared view
  state. The existing server-created `dishTagSection` slot cannot independently
  follow a date stored only inside RestaurantView; adjust that boundary.
- Refresh the default date when a page stays open across Helsinki midnight,
  without overriding an explicitly selected date. Handle the Monday week change
  by refreshing the weekly dataset. Do not rely solely on ISR for client date
  selection.
- Update page descriptions and structured data to describe the displayed menus.
  Keep `/radiator` and `/api/current-day-menus` today-only by selecting today's
  date explicitly. Audit all `menus[0]` assumptions, including SEO helpers.

## 4. AI Dish Tags and filter behavior

Preserve ADR 0003: **one complete daily menu per Restaurant per AI request**.
Group weekly data by `(restaurantId, date)` before calling `tagMenuItems`.
Keep line ordering and headings available to the model, and include the date in
request/log context. The vocabulary, side exclusion, dessert rule and
vegan/vegetarian relationship stay the same.

Reprocessing the whole week every day would repeatedly tag unchanged menus.
Cache successful results at the daily-menu level using a hash of the ordered
item text and dietary flags plus the restaurant and tagging version. The version
must change with prompt/schema/model settings that affect results. Reuse tags
only when the whole ordered daily menu matches; a dish-only cache would lose
main/side context. Store hash/outcome/version in `menu-status`, with tags on the
existing dish rows. An in-memory cache alone does not survive scheduled Docker
runs.

On a changed daily menu, retag the whole day. On failure, save the new menu
untagged and retry on a later run; keep successful cached tags for unchanged
days. Never apply old tags by row position to changed content. Limit concurrent
AI requests and respect the existing timeout so a weekly run does not become
one long serial queue or an unbounded burst.

The Dish Tag section counts and returns only the selected day's Dishes.
Preserve the existing behavior that results can include hidden Restaurants.
Hide tags with zero matches and clear an active tag if it becomes unavailable
when changing dates. Date tabs and AI suggestions must share the same selected
date; no whole-week filter mode is needed.

## 5. Scraping cadence and cache freshness

**Refresh the entire current week daily. Once a week is insufficient:** menus
can be published late, dishes can change, holidays can be corrected, and a
Monday-only failure would otherwise persist for the whole week.

Recommended starting schedule: 06:00 and 10:00 Europe/Helsinki, every day including weekends.
The first run prepares the day; the second catches late publication and
pre-lunch updates. This is a proposed schedule, not a claim about the deployed
cron. A simpler minimum is one daily morning run, including weekends for Huoltamo.
The week navigation still includes weekends even when no lunch is published.

Configure the scheduler's timezone explicitly and verify DST behavior. Refresh
all days, including Monday/Tuesday on later days, so weekly browsing stays
consistent. Use persistent tag reuse to avoid paying to reclassify unchanged
menus. Record per-Restaurant/date coverage and failures so an apparently
successful process does not conceal an empty week.

Trigger frontend revalidation after successful writes/status changes; preserve
hourly ISR as fallback. If query handling makes page routes dynamic, add an
explicit persistent cache around Sheets reads: React `cache()` alone only
memoizes within a render/request. Cache the bounded weekly dataset independently
of the selected date and invalidate it after sync. Frontend revalidation cannot
fetch newer restaurant data by itself; only a scraper run does that.

## 6. Implementation sequence and validation

1. **Date/model contract and fixtures:** use the agreed seven-day tab UI;
   add week helpers, availability/freshness types and weekly RSS fixtures.
   Audit live weekly coverage for every Restaurant and verify closure markers.
2. **Reader and safe storage:** group Sheets rows by date, read configured
   Restaurant tabs, add status reconciliation and atomic writes. Make existing
   today-only views select today's date before any weekly data is written.
3. **Weekly ingestion and tagging:** parse each fetched payload for the week,
   update defaults/overrides, add daily tagging groups and persistent reuse,
   preserve single-day CLI behavior, and isolate Restaurant failures.
4. **UI and filter scope:** implement shared date tabs on both pages,
   date-aware opening hours, URL continuity, and selected-day tag results.
5. **Rollout and operations:** document and configure the actual Unraid schedule,
   update CONTEXT.md and affected ADR consequences, validate against dev Sheets,
   then deploy the compatible reader before enabling production weekly writes.

Colocated business-logic tests should cover:

- Helsinki week boundaries, weekends, DST, ISO-year boundaries and headings
  without years;
- all dated RSS items, multiple items on the same date, missing/invalid dates,
  stale feeds, partial weeks, closures and bilingual HTML blocks;
- grouping mixed-date Sheets rows, missing tabs, reconciliation after partial
  failures, removed dishes, metadata exclusion and obsolete trailing rows;
- tagging group isolation, ordered-context hash invalidation, valid zero-tag
  results, version changes, failure retries and unchanged-day reuse;
- selected-day tag counts/results, weekend date labels and selected-tag reset;
- today's legacy API/radiator behavior with a multi-day sheet.

Use `--dry-run` for every scraper validation unless explicitly authorized to
write to Sheets. Dry run still makes restaurant HTTP requests and can make AI
requests with the current implementation; mock AI in unit tests and avoid
unintended repeated paid calls. Run relevant package tests, typecheck, lint and
format checks. Manually check both routes on mobile/desktop, deep links,
keyboard navigation, missing menus, and midnight/week rollover.

Completion means every configured Restaurant can ingest all published days,
both routes expose the current week, Dish Tags never mix dates accidentally,
partial failures preserve correctly dated last-good data, today's API/radiator
remain compatible, and the deployed daily refresh is verified. Upstream
unpublished data is shown honestly; ingestion cannot guarantee menus that a
Restaurant has not published.

## Implementation progress — 12 November 2026

Implemented: seven-day date tabs on both pages; shared selected-date state and
URL continuity; date-aware Dish Tags and opening hours; date-grouped Sheets
reading; weekly ingestion with one fetch per source; persistent daily-menu tag
reuse; atomic menu/status writes; partial-failure retention; today-only legacy
API and radiator selection. The CLI supports weekly defaults, explicit week or
single-day scopes, dry run and `--skip-tagging`.

The live dry run parsed menus for all 12 Restaurants. No weekend dishes are
currently published by those sources for 14–15 November; the implementation
keeps those dates available and ingests them when published.

Still required before production rollout: review the UI in a browser, deploy the
compatible frontend before the scraper, and configure/verify the actual Unraid
schedule and single-writer host lock. No production Sheets writes, deployment,
or scheduler changes were performed. Initial tagging is sequential (one request
at a time); cached menus avoid repeat calls on later runs.
