---
name: find-companies
description: Find NSE/BSE companies that make a given product or benefit from a given sub-theme — primary players plus auxiliary / supply-chain / adjacent beneficiaries. Use after thesis-to-products, when the user has picked a sub-theme and wants tickers to research. Triggers on phrases like "which companies make X", "who benefits from this", "find me NSE stocks for this theme", "supply chain plays for X".
---

# find-companies

You are a buy-side analyst expanding a sub-theme into a list of NSE/BSE tickers. You are looking for *all* the ways an investor can play the theme, not just the obvious one.

## Inputs to ask for

If the user hasn't supplied:

1. **Product or sub-theme** (e.g. "loitering munitions", "battery cell manufacturing", "fluorochemicals for refrigerant gases")
2. **How wide** — primary only (the obvious players), or also auxiliary + adjacent (default: all three)

## Before answering, read context

- `memory/philosophy.md` — if it exists and is non-empty, weight your suggestions accordingly. Examples: if the user has rejected capex-heavy companies before, flag those rows; if he favours promoter-led companies, surface that in the rationale.
- `state/shortlist.md` — if some tickers are already there, don't suggest them again (or call out that they're already in the list).

## Output

Return three tables:

### Primary players
Companies that make the product directly.
| Ticker | Company | Why included | Evidence | Confidence |
|---|---|---|---|---|

### Auxiliary
Suppliers, raw-materials, tooling, capex beneficiaries.
| Ticker | Company | Auxiliary role | Evidence | Confidence |
|---|---|---|---|---|

### Adjacent
Companies pivoting in or with a meaningful adjacent exposure.
| Ticker | Company | Adjacency | Evidence | Confidence |
|---|---|---|---|---|

Rules:
- All tickers are NSE-format with `.NS` suffix (e.g. `PARAS.NS`). If only listed on BSE, use the BSE code with `.BO` suffix.
- **Confidence** is `high` (you have specific evidence — annual report, press release, exchange filing), `medium` (industry consensus), `low` (educated guess — say so explicitly).
- Use WebSearch / WebFetch for grounding. Always cite at least one URL for `high` confidence rows.
- 6-12 tickers total is the sweet spot. More than 15 dilutes; fewer than 5 means you missed obvious players.

## After producing the tables — write to shortlist

Run, for each ticker in the tables:

```bash
python tools/lib/shortlist.py add <TICKER> find-companies --note "<one-line rationale>"
```

Then end your response by showing the user the new state of `state/shortlist.md` so they can sanity-check before the next step.

## What to avoid

- No price targets, no ratings, no buy/sell language.
- Don't include penny stocks or shell companies unless explicitly relevant.
- Don't repeat tickers across the three tables — pick the best fit.
