---
name: anomaly-scan
description: Pull 10-12 years of standardized financials (P&L, Balance Sheet, Cash Flow) for an NSE/BSE ticker and surface anomalies and patterns against the user's criteria. Use after find-companies, or any time the user wants a deep financial-pattern read on a single ticker or the whole shortlist. Triggers on "scan this for anomalies", "deep dive on X's financials", "run the anomaly scan", "scan all candidates", "what's weird in their books".
---

# anomaly-scan

You are looking for *patterns* and *anomalies* in long-horizon financials, not picking ratios off a one-year cross-section. The user explicitly cares about how the story moves over a decade.

## Inputs

- **Ticker** (e.g. `PARAS.NS`), OR
- **`--all-candidates`** — scan every ticker in `state/shortlist.md` whose status is `candidate`.

## Before scanning, load context

- `memory/criteria.md` — the user's anomaly checklist. **This is the source of truth for what counts as anomalous.** Use these as your default lenses.
- `memory/philosophy.md` — additional weighting (e.g. "user treats high promoter pledging as immediate disqualifier").
- `state/shortlist.md` — to know which tickers are in scope and their current status.

## Step 1: fetch financials

Run:

```bash
python tools/fetch_screener.py <TICKER>
```

This returns canonical JSON with `statements.pnl`, `statements.balance_sheet`, `statements.cash_flow`, `statements.ratios`, plus `years` (typically 10-12 most recent fiscal years). The script caches to `.cache/<TICKER>.json`, so re-runs are cheap. Add `--no-cache` to force a refresh.

If the script returns an `error` field:
- Try `python tools/fetch_yfinance.py <TICKER>` to confirm the ticker exists.
- If yfinance also fails, tell the user the ticker may be wrong and stop.
- If yfinance works but Screener doesn't, surface that and suggest checking Screener manually.

## Step 2: scan for anomalies

Apply each criterion from `memory/criteria.md` to the data. For each anomaly found, capture:

- **Statement** (P&L / Balance Sheet / Cash Flow / Ratios)
- **Pattern** (one-line description of what's anomalous)
- **Years where it appears** (e.g. FY22-FY24)
- **Magnitude** (the actual numbers, not just "high")
- **Severity**: `flag` (worth a look), `concern` (needs explanation), `red-flag` (likely disqualifier on its own)

## Step 3: write the report

Output structure:

```markdown
# Anomaly scan — <TICKER> (<Company name>)

**Source:** Screener.in (consolidated unless noted), <years range>
**Cache:** .cache/<TICKER>.json (fetched <date>)

## Headline summary
<2-3 sentences: what's the shape of the story over the decade — growth, stagnation, turnaround, drift>

## P&L anomalies
| Pattern | Years | Magnitude | Severity |
|---|---|---|---|

## Balance Sheet anomalies
| ... |

## Cash Flow anomalies
| ... |

## Ratio anomalies
| ... |

## Cross-statement patterns
<This is the most valuable section. Examples: PAT growing while OCF flat (earnings quality), capex spike followed by no revenue lift, debt rising despite "no growth need", working capital ballooning during slow-revenue years>

## What to investigate further
<2-4 specific follow-ups the user should chase before deciding>
```

## Step 4: update shortlist

For each ticker scanned, run:

```bash
python tools/lib/shortlist.py update <TICKER> scanned --note "<short summary, e.g. '3 BS flags, 1 CF red-flag'>"
```

## What to avoid

- Don't recommend buy/sell. The user does that.
- Don't gloss over noise — if 2014 had weird numbers from a one-time event, say so rather than flagging it.
- Don't make up numbers. If a year is missing, say "not available".
- Don't blow context by dumping the full statements. Quote 2-3 numbers per anomaly, that's it.
