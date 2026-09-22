# Dish Tags live on the menu row, not in their own table

Dish Tags are stored as a `dishTags` column on each restaurant's existing sheet
tab, next to the dish they describe, rather than in a separate tab or a separate
spreadsheet the way opening hours are.

## Considered Options

A separate table was the obvious shape and was rejected because **Menu Items
have no id**. A row is `(restaurantId, restaurantName, date, item,
dietaryFlags, lastUpdated)`, so the only available join key is the dish's free
text — which the fetchers decode, trim and normalise differently per source, and
which carries emoji, prices and HTML entities. A join on that key fails
silently: tags quietly stop matching dishes and the section just empties out.

A separate tab in the main spreadsheet has a second problem: the frontend
enumerates every tab in that spreadsheet and turns each one into a Restaurant,
so the tab would surface as a phantom restaurant until a denylist was added.

## Consequences

Tagging must happen between fetching and writing, so a tagging failure degrades
to an empty column rather than being retryable afterwards. This is the accepted
trade: the menus are the product and must be written regardless, and the whole
tab is cleared and rewritten on every run anyway, so tags and dishes cannot
drift apart by construction.
