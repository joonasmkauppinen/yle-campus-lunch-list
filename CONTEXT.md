# Yle Campus Lunch List

Aggregates the daily lunch menus of the campus restaurants around Yleisradio in
Pasila, Helsinki, and presents one selected day at a time, with tabs for the current week.

## Language

**Restaurant**:
A campus eatery that publishes a lunch menu. Identified by a stable kebab-case id
(`iso-paja`) that is also its tab name in the sheet.
_Avoid_: Venue, place, cafeteria

**Area**:
The fixed location group a Restaurant belongs to: `yle-campus` (Ylen kampusalue),
`ilmala` (Ilmala) or `pasila` (Pasila). Set in the frontend config, never by
the user. The page lists Restaurants under their Area; users can reorder and
hide whole Areas and reorder Restaurants within one, but never move a
Restaurant to another Area.
_Avoid_: Group, location, campus, region

**Menu Item**:
One published line of a restaurant's menu for a given day. Its text is its only
identity; there is no item id.
_Avoid_: Meal, food, entry

**Dish**:
A Menu Item that is actually something you can eat. Some Menu Items are not
Dishes: disclaimers, section headers and price notices are published on the same
lines.
_Avoid_: Course, plate

**Side**:
A Dish that accompanies a main rather than being chosen on its own: rice, mash,
fries, a sauce, lingonberries, cooked vegetables. Many restaurants print sides
on their own lines beneath the main. A Side is always Untagged.
_Avoid_: Garnish, extra

**Menu Snapshot**:
The complete set of Menu Items for the current Helsinki calendar week
(Monday–Sunday), grouped by Restaurant and date. Successful daily menus replace
that date; unavailable or failed dates retain their last-good data with a
freshness warning. There is no menu history outside the active week.
_Avoid_: Menu history, archive

**Dietary Flag**:
A restaurant-published marker on a Menu Item (`G`, `L`, `M`, `VEG`). Vocabulary
and meaning vary between restaurants; flags are passed through, not normalised.
_Avoid_: Allergen, diet code

**Dish Tag**:
A term from a flat, fixed vocabulary describing what kind of food a Dish is
(`chicken`, `pizza`, `asian`). Deliberately mixes axes — protein, cuisine, form,
course — because it exists to answer "what do I feel like eating today", not to
classify food correctly. A Dish carries zero or more; zero is normal and
expected.
_Avoid_: Category, label, class, type

**Tag Id / Tag Label**:
The Tag Id is the stable English identifier stored in the sheet and in code
(`tex-mex`). The Tag Label is the Finnish text shown to the user (`Tex Mex`).
Same split as Restaurant id versus display name.

**Untagged**:
A Menu Item carrying no Dish Tags. It still appears in its restaurant's list; it
is simply unreachable through Dish Tags.

## The Dish Tag vocabulary

Fourteen tags, fixed. `meat`, `chicken`, `fish`, `vegetarian`, `vegan`, `soup`,
`salad`, `pizza`, `burger`, `dessert`, `asian`, `indian`, `italian`, `tex-mex`.

**Narrower wins**:
Where two tags overlap, the broader one excludes the narrower one, so that the
broad tag stays a useful filter instead of matching almost everything. `meat` is
red meat and excludes `chicken` and `fish`; `asian` is East and Southeast Asian
and excludes `indian`; `italian` excludes `pizza`.

**Vegan nests in vegetarian**:
The one deliberate exception to "narrower wins". A vegan Dish carries both tags,
so `vegetarian` shows everything free of meat and fish and `vegan` narrows it.

**Dessert stands alone**:
A dessert carries only `dessert`. Nearly every dessert is vegetarian, so tagging
them `vegetarian` or `vegan` would bury the vegetarian lunches those tags exist
to find. For the same reason a Side is never tagged, whatever its flags.
