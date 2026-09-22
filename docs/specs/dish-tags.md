# Dish Tags

## Problem Statement

The front page lists every campus restaurant and every Menu Item each one is
serving today. On a normal weekday that is ten restaurants and sixty-odd lines
of Finnish dish names. Someone who already knows what they feel like eating —
fish, or a pizza, or something vegan — has no way to ask that question. They
have to read all ten lists and hold the answer in their head, which is exactly
the work the site exists to save them.

## Solution

A grid of tag buttons above the restaurant lists, each one an emoji over a
Finnish label: Kala, Pizza, Vegaani, Keitto. Only tags that actually match
something on today's menus appear, each showing how many Dishes it matches.
Tapping one highlights it and opens a section underneath listing every matching
Dish, grouped by the restaurant serving it. Tapping it again closes the section.

The tags themselves are produced by the scraper. After a restaurant's Menu
Items are fetched and before they are written to the sheet, each one is put to
Jev, a model that answers yes/no questions with calibrated probabilities. It is
asked once per tag, plus once more to decide whether the line is a Dish at all —
menus carry disclaimers, section headers and price notices on the same lines.
Tags whose probability clears a threshold are stored alongside the Dish.

## User Stories

1. As a hungry Yle employee, I want to see what kinds of food are on offer
   today at a glance, so that I can decide where to eat without reading ten
   menus.
2. As a hungry Yle employee, I want to tap Kala and see every fish Dish on
   campus today, so that I can pick one when I have already decided I want fish.
3. As a hungry Yle employee, I want the matching Dishes grouped by restaurant,
   so that I know where to walk.
4. As a hungry Yle employee, I want the restaurants in the results to appear in
   the same order as the main list, so that the page does not feel like two
   different sites.
5. As a hungry Yle employee, I want to see how many Dishes a tag matches before
   I tap it, so that I do not open a section with one item in it.
6. As a hungry Yle employee, I want tapping the active tag again to close the
   section, so that I can get back to the full view without reloading.
7. As a hungry Yle employee, I want only one tag active at a time, so that the
   results are always a simple, readable list.
8. As a vegetarian, I want a Kasvis tag that shows everything free of meat and
   fish, so that I can see all my options in one place.
9. As a vegan, I want a Vegaani tag that narrows further than Kasvis, so that I
   am not shown halloumi and egg dishes.
10. As a vegan, I want vegan Dishes to also appear under Kasvis, so that the
    broader tag is not mysteriously missing things.
11. As someone who does not eat red meat, I want the Liha tag to mean red meat
    and not poultry, so that Kana and Liha are genuinely different lists.
12. As someone browsing for a cuisine, I want Aasialainen and Intialainen to be
    separate, so that neither swallows the other.
13. As someone browsing for a cuisine, I want Italialainen to mean pasta and
    risotto rather than repeating the pizza list, so that both buttons are
    worth pressing.
14. As a hungry Yle employee, I want tags that nobody is serving today to be
    absent rather than empty, so that every button I see leads somewhere.
15. As a hungry Yle employee, I want the section to sit above the restaurant
    lists, so that I see the shortcut before I start reading.
16. As a hungry Yle employee, I want the page to look exactly as it does today
    when no tags exist, so that a backend problem does not produce a broken
    page.
17. As a hungry Yle employee, I want disclaimers and section headers such as
    "Huomioimme myös muut erikoisruokavaliot pyydettäessä" to never appear
    under a tag, so that the results are all actually food.
18. As a hungry Yle employee, I want a Dish that is both chicken and Asian to
    appear under both tags, so that I find it whichever way I am thinking about
    it.
19. As a hungry Yle employee, I want the tag labels in Finnish like the rest of
    the site, so that the page does not switch languages halfway down.
20. As a hungry Yle employee, I want an untagged Dish to still appear in its
    restaurant's list, so that no food is hidden from me by a tagging mistake.
21. As a hungry Yle employee, I want the tag grid to cover every restaurant
    regardless of which ones I have hidden, so that the shortcut can still show
    me something I would otherwise have missed.
22. As a mobile user, I want the grid to lay out sensibly on a narrow screen,
    so that I can use it while walking to lunch.
23. As a screen reader user, I want each tag button to announce its label and
    whether it is selected, so that I can use the section without sight.
24. As a keyboard user, I want to reach and activate tags with the keyboard, so
    that I do not need a pointer.
25. As a scraper operator, I want a restaurant's menus to be written to the
    sheet even when tagging fails for it, so that an outage in the model never
    costs me the actual menus.
26. As a scraper operator, I want tagging to fail for one restaurant without
    affecting the other nine, so that one bad response does not empty the
    feature.
27. As a scraper operator, I want dry run to perform tagging and print the
    resulting tags, so that I can validate the feature without writing to the
    sheet or spending Google API quota.
28. As a scraper operator, I want the scraper to run normally with no API key
    configured, producing untagged menus, so that a missing secret degrades
    rather than breaks.
29. As a scraper operator, I want to see in the logs how many Dishes were
    tagged per restaurant, so that I can spot a silent regression.
30. As a developer, I want the tag vocabulary defined once and shared, so that
    a typo in a tag id is a type error rather than a silently empty grid.
31. As a developer, I want the frontend to ignore tag ids it does not
    recognise, so that removing a tag from the vocabulary does not break the
    page before the sheet is rewritten.
32. As a developer, I want the frontend to tolerate a missing or empty tags
    column, so that a sheet written by an older scraper still renders.
33. As a developer, I want the threshold to be a single named constant, so that
    I can tune how eagerly tags are applied after seeing real output.
34. As a developer, I want the tag-to-label-and-emoji mapping to live beside
    the restaurant config, so that the next person looks in the obvious place.
35. As a developer, I want the pure parts of tagging tested against a recorded
    model response, so that the tests match how every other parser in this repo
    is tested.

## Implementation Decisions

**Vocabulary.** Fourteen Dish Tags: `meat`, `chicken`, `fish`, `vegetarian`,
`vegan`, `soup`, `salad`, `pizza`, `burger`, `dessert`, `asian`, `indian`,
`italian`, `tex-mex`. Stable English ids in code and in the sheet; Finnish
labels in the UI, mirroring how Restaurant ids and display names are already
split. The vocabulary and its overlap rules are recorded in `CONTEXT.md`; the
governing rule is **narrower wins** — the broader tag excludes the narrower one
so it stays a useful filter — with `vegan` nesting inside `vegetarian` as the
single deliberate exception.

**Storage.** Tags are written as a seventh column on each restaurant's existing
sheet tab, comma-separated, mirroring the existing dietary flags column. Not a
separate tab or spreadsheet: Menu Items have no id, so any separate table would
have to join on free dish text, and the frontend turns every tab in the main
spreadsheet into a Restaurant. Recorded as ADR 0001.

**Model and call shape.** Jev via OpenRouter, using TypeSafe's native
`systemone` request schema rather than chat completions, because the calibrated
probabilities exist only in that schema. One request per Dish: `state` is the
dish text plus its dietary flags, and the request carries fifteen yes/no
questions — one per tag, plus one asking whether the line is a Dish at all.
Requests within a restaurant are issued concurrently. Chosen over batching a
restaurant's whole list into one request because the state is a six-word dish
name, so the token saving is negligible while indexed question keys across
several items invite misalignment bugs. Recorded as ADR 0002.

**Thresholding.** A tag applies when its probability clears a single named
threshold, starting at 0.7, with no cap on how many tags a Dish may carry. The
"is this a Dish" question gates everything: below threshold, the Menu Item gets
no tags at all. The threshold is deliberately strict because a wrong tag costs
more than a missing one — a user who taps Kala and is shown chicken stops
trusting the feature.

**Dietary flags feed the model rather than bypassing it.** The `vegetarian` and
`vegan` tags are decided by Jev with the Menu Item's dietary flags supplied as
part of the state, not derived from those flags by rule. The flag vocabulary is
not normalised across restaurants — fetchers pass through whatever the source
publishes — so a rule would be confidently wrong for specific restaurants,
which is worse than being occasionally wrong everywhere.

**Pipeline placement.** Tagging runs inside each restaurant's existing
try/catch in the scraper's main sequence, between fetching and writing.
Per-restaurant isolation is preserved. On any tagging failure, or with no API
key configured, the menu rows are written with an empty tags column. The menus
are the product; the tags are a garnish, and stale menus would be a far worse
bug than a missing button.

**Dry run.** Dry run performs tagging and prints the resulting tags in the
payload log, then skips the sheet write and revalidation as it does today.
Tagging is enrichment rather than a write, and dry run is the only way to
validate the feature. A full run costs a small fraction of a cent.

**Module shape.** The shared types package gains the tag id list, the tag id
union type, and an optional tags field on the menu item and sheet row types.
The scraper gains a tagging module holding the question text and the pure
answers-to-tags selection, and its sheet writer gains the new column. The
frontend gains a dish-tag config module holding label and emoji beside the
restaurant config, a pure dish-tag module holding parsing and aggregation, a
client component for the grid and its results section, and a widened read range
in its sheet reader.

**Rendering.** The section is rendered on the home page only, above the
restaurant grid, below the heading and date. It is fed from the same server
data as the restaurant list and deliberately ignores the stored
hide-a-restaurant preferences, which keeps it outside that component's client
state and makes its server and client renders identical. Results reuse the
existing menu item component inside a light per-restaurant block — not the full
restaurant card, whose opening hours, address and website link are noise when
showing two Dishes.

## Testing Decisions

A good test here exercises external behaviour through a public function: given
this model response and this threshold, these tags; given these sheet rows,
this grid and these groups. It does not assert on how many requests were
issued, in what order, or with what prompt text. Prompt wording and request
shape must stay free to change without breaking a test.

This repo has not mocked anything until now. Every parser is tested as a pure
function fed a fixture recorded in `docs/` — `parseIsoPajaHtml` against
`iso-paja-sample-response-data.html`, the Huoltamo parser against a recorded
JSON payload — and the network-touching function above it is left thin and
untested. This feature deliberately breaks that pattern in exactly one place,
by stubbing the global fetch in the tagging tests. The justification is narrow:
the behaviour that matters most here is a **failure** path — tagging failing
must still produce written menus — and a failure cannot be expressed as a
recorded fixture. Everything reachable by fixture continues to be tested by
fixture.

Three seams:

1. **The tagging entry point**, in the scraper, taking Menu Items and returning
   them tagged. The global fetch is stubbed. On the success path it is fed a
   recorded Jev response committed to `docs/` alongside the other payload
   fixtures, covering the threshold boundary in both directions, the is-a-Dish
   gate suppressing all tags, a Dish that legitimately earns several tags, and
   a response where nothing clears the threshold. On the failure path the stub
   throws, returns a non-success status, and returns a malformed body; each
   must yield untagged Menu Items rather than an exception. A missing API key
   is covered the same way. Because this seam reaches the whole path, the
   answers-to-tags selection stays a private implementation detail rather than
   being exported for testing.
2. **The sheet row formatter**, in the scraper. An existing seam with existing
   tests, extended for the new column: tags present, tags empty, and the
   serialization matching the dietary flags convention.
3. **The frontend dish-tag module**. A pure module, no stubbing. Covers parsing
   the column, dropping ids outside the vocabulary, tolerating a missing or
   empty column, computing which tags have matches and their counts, and
   grouping matches by restaurant in configured order. Prior art: the date and
   SEO helper tests in the same directory.

The per-restaurant orchestration in the scraper's main sequence stays untested,
as it is today. Dry run against live data remains the end-to-end check before
shipping.

## Out of Scope

- The radiator signage view. It is non-interactive, so a tag grid has nothing
  to offer it.
- The per-restaurant page. Too few Dishes for filtering to earn the space.
- Multi-tag selection, and any union or intersection semantics.
- Respecting the hide-a-restaurant preferences inside the tag section.
- Menu history. The sheet holds exactly one date, replaced on every run, so
  Dish Tags are only ever computed for the date the scraper targeted.
- Caching or reusing tags for a dish seen on a previous day. At roughly two
  hundredths of a cent per run there is nothing to save.
- Normalising the dietary flag vocabulary across restaurants.
- Free-text or fuzzy search over Dishes.
- Any user-facing control over the threshold.
- Backfilling tags for dates already written.

## Further Notes

The OpenRouter listing for Jev could not be verified from this environment: the
model page returned 404 and the id appears in none of the 452 models in
OpenRouter's public catalogue. It is presumably unlisted or account-gated. The
request and response shapes in this spec come from a real exchange supplied by
the developer, which matches TypeSafe's documented `systemone` schema exactly.
The first implementation step should therefore be a single live call before any
other code is written — and if the route turns out not to work, the fallback is
a general model with structured output, which invalidates ADR 0002 and the
thresholding decisions that rest on it.

The client is an open question deliberately left to implementation: the
TypeSafe SDK accepts a base URL override and would give typed helpers, but it
posts to a path that may not line up with OpenRouter's. Try the SDK, fall back
to plain fetch with hand-written types, which is what every other network call
in the scraper already does.

Two numbers are expected to need tuning after a week of real output. The 0.7
threshold is most likely too strict for `vegetarian`, where the Finnish dish
name often carries no signal and the dietary flags do the work. And `tex-mex`
and `indian` may rarely clear it at all — harmless, since a tag with no matches
simply does not render, but worth watching before concluding the vocabulary is
right.
