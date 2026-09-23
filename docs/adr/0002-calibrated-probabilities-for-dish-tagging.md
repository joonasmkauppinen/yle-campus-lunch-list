# Dish Tagging asks for calibrated probabilities, not generated JSON

_Superseded by [ADR 0003](0003-a-general-llm-tags-the-whole-menu.md)._

Dishes are tagged by asking Jev, a System One model, one yes/no question per tag
and keeping the tags whose probability clears a threshold — rather than
prompting a general LLM to return a JSON array of tags.

## Considered Options

A general LLM returning `["chicken", "asian"]` was the obvious approach. It was
rejected because it gives no way to tune how eagerly tags are applied: the model
either says a tag or it doesn't, and the only correction available is rewriting
the prompt and hoping. Asking for a probability per tag turns that into a single
number, so precision and recall can be traded off against a week of real output
without touching the prompts.

This matters specifically here because a wrong tag is much worse than a missing
one. Someone who taps Kala and is shown a chicken dish stops trusting the
feature, while a dish that never appears under any tag is invisible and costs
nothing. A threshold makes that asymmetry adjustable; generated JSON does not.

## Consequences

The model is reached through OpenRouter using TypeSafe's native `systemone`
request schema, not the chat-completions API, because the probabilities exist
only in that schema. Swapping in a general LLM later therefore means rewriting
the request, the response parsing and the thresholding together.
