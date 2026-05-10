---
name: compare
description: Answer free-form comparative questions across the user's current shortlist of NSE/BSE tickers — debt-to-asset, ROCE rankings, revenue CAGR, working-capital strain, anything pullable from financials. Callable at any point in the workflow, mid-flow, repeatedly. Triggers on "compare these", "rank by X across these companies", "what's the X across the shortlist", "side-by-side", "which of these has the highest/lowest Y".
---

# compare

A pure read-only skill. The user is somewhere mid-research, has a shortlist, and wants a cross-cutting question answered without re-running anything upstream. Be fast, accurate, and table-shaped.

## Inputs

- **Question** in plain English (required)
- **Tickers** (optional). If not given, default to *all tickers currently in `state/shortlist.md`*. If the user names a status filter ("the scanned ones", "rejected ones"), use that.

## Before answering, load context

- `state/shortlist.md` — to resolve "these companies" / "the shortlist" / "the scanned ones".
- `memory/criteria.md` — for what counts as a meaningful threshold (e.g. "we treat D/E > 1.5 as concerning").
- `memory/philosophy.md` — for tone and weighting in your observation paragraph.

## Step 1: gather data

For each ticker in scope:

1. Check `.cache/<TICKER>.json` — if it exists and is <7 days old, load it directly.
2. If not cached, run:
   ```bash
   python tools/fetch_screener.py <TICKER>
   ```

Do not re-fetch tickers that are already cached; that's the whole point of caching.

If a ticker fails to fetch, include it in the output with all metric cells as `n/a` and a row note explaining the failure. Don't drop it silently.

## Step 2: compute the metric(s) the question asks for

Common ones, with definitions:

- **Debt / Equity** = Borrowings ÷ Shareholders' Funds (latest year)
- **Debt / Assets** = Borrowings ÷ Total Assets
- **ROCE** = read from Screener's `Ratios` section (`ROCE %`)
- **ROE** = read from Screener's `Ratios` section
- **Revenue CAGR (5yr / 10yr)** = (latest revenue / revenue N years ago)^(1/N) − 1
- **OCF CAGR** = same shape on Cash from Operating Activity
- **OCF / PAT ratio** = avg of last 5 years (earnings-quality check)
- **Working capital intensity** = (Receivables + Inventory) / Revenue
- **Promoter holding / pledging** = from Screener's `shareholding` section if scraped, else mark `n/a`

For any metric not directly in the data, compute it from raw lines in the JSON. Show the formula in a footnote when it's non-obvious.

## Step 3: output

```markdown
# Comparison — <one-line of the question>

**Scope:** <N tickers, source: shortlist | explicit list>
**Source:** Screener.in (cached <oldest fetch date> – <newest>)

| Ticker | Company | <Metric 1> | <Metric 2> | ... |
|---|---|---|---|---|

**Observation:** <2-4 sentences. Call out outliers by name. Don't recommend — describe.>

**Caveats:** <data freshness, missing rows, anything that affects how to read the table>
```

## Rules

- This skill writes nothing. No shortlist updates, no decision logs, no philosophy refresh. It's safe to call as many times as the user wants.
- Always sort the table by the most relevant metric in the question (highest first unless context flips it).
- If the question is ambiguous ("which is best"), don't guess "best" — pick 2-3 metrics that operationalise the question and show them side-by-side.
- If the metric requires more than 5 years of data and you only have 3, say so and proceed with what's available.
- Cite Screener and the cache date once at the top, not per-row.
