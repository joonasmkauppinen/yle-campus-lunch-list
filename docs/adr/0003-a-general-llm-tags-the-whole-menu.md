# A general LLM tags a restaurant's whole menu at once

Supersedes [ADR 0002](0002-calibrated-probabilities-for-dish-tagging.md).

Dishes are tagged by sending a restaurant's whole menu for the day to a general
LLM (DeepSeek v4.1 Flash via OpenRouter) in one chat completion, with the
answer constrained by a JSON schema. For each line the model returns a short
English gloss, the line's kind — `main`, `side`, `breakfast` or `not_food` —
and the Dish Tags for a `main`. Only mains keep their tags.

## Considered Options

ADR 0002 chose Jev's calibrated per-tag probabilities for their tunable
threshold. Real output showed the threshold was not the problem. Jev sees
one line at a time, so it cannot tell a main from the rice, mash or
lingonberries printed on their own lines beneath it, and every such side
cleared `vegetarian` — the tag matched nearly everything and was useless. It
also made outright misreadings no threshold could fix: "Perunasosetta" (mashed
potatoes, flagged `Ve, G`) came back as pizza and dessert, and "Ruispuuroa"
(rye porridge) as soup.

Seeing the whole menu is what fixes the side dish problem, so the request is
per restaurant rather than per line. The index-misalignment risk that argued
against batching is contained by numbering the lines, having the model echo
each index, and dropping any answer whose index is outside the menu.

Reasoning is disabled. On today's menus it multiplied latency tenfold, with
several restaurants running past a minute, and did not tag any better than the
English gloss the schema already asks for.

## Consequences

There is no threshold to tune. Eagerness is controlled by the prompt ("a wrong
tag is much worse than a missing one") and by the rules the code enforces
after the model answers: tags only on a `main`, nothing but `dessert` on a
dessert, and `vegetarian` on every `vegan` main.

A malformed or failed response now leaves a whole restaurant untagged instead
of a single line. That matches the existing per-restaurant isolation, and the
menus are still written.

A run costs roughly a third of a cent and finishes in a few seconds per
restaurant.
