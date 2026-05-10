---
name: decide
description: Capture the user's accept or reject decision on a ticker, with a written reason, and cross-question them when the reason is shallow. Updates the shortlist and triggers a refresh of the user's investment philosophy. Triggers on "accept this", "reject this", "I'm passing on X", "X is in", "shortlist this", "kill X", "decide on X".
---

# decide

This is the human-in-the-loop skill. The user has researched a ticker (probably via `anomaly-scan` and `compare`) and now wants to commit to a verdict. **Your job is not to influence the decision** — it's to capture the reasoning rigorously and probe when the reasoning is thin.

## Inputs

- **Ticker** (required, NSE format e.g. `PARAS.NS`)
- **Verdict**: `accept` or `reject` (required)
- **Reason**: free text (required, but you'll evaluate quality before saving)

## Step 1: read context

- `state/shortlist.md` — confirm the ticker is in there (warn if not — they may be deciding on something they never scanned).
- `.cache/<TICKER>.json` — if cached, briefly look at the most prominent anomalies so you can refer to them in cross-questioning.
- `memory/philosophy.md` — to phrase cross-questions in line with the user's known patterns.

## Step 2: evaluate the reason

Apply this gate before saving:

| Reason quality | Action |
|---|---|
| **Specific & causal** — names a mechanism, references actual numbers or facts ("rejected: receivables grew 4× in 3 yrs while revenue grew 1.5×, signals channel-stuffing") | Save directly |
| **Generic** — "looks weak", "not interested", "vibes", "management seems off" with no specifics | Cross-question |
| **Single-word / sub-2-sentence** | Cross-question |
| **Contradicts the data you can see in cache** — e.g. they say "low growth" but revenue 5yr CAGR is 22% | Push back, then cross-question |

## Step 3: cross-question (when needed)

Ask **1-2 sharp follow-ups**, never more. Make them stress-test the reason. The goal is the user types the actual reasoning out, not for you to lead them to an answer.

Use the management-vs-demand frame the user explicitly described:

> If they reject "because management isn't growth-oriented" → ask "Is it that management *didn't try*, or that they *tried and the demand wasn't there*? The first kills the thesis, the second might mean it's now timed."

Other example probes:
- "What would have to be true for you to flip this verdict?"
- "Is this a *company* problem or a *sector* problem? If sector, why are you keeping the others?"
- "You called out X — but the cash-flow side looks clean. Are you weighting the BS issue more than CF?"

After they answer, fold their answer back into the saved reason — don't store the chat as-is.

## Step 4: save the decision file

Write to `decisions/<TICKER>/<YYYY-MM-DD>.md`:

```markdown
---
ticker: <TICKER>
verdict: accept | reject
date: <YYYY-MM-DD>
shortlist_status_before: <previous status>
---

# <Verdict> — <Company> (<TICKER>)

## Reason
<the user's reasoning, post cross-questioning, full and specific>

## Anomalies that drove this
<bulleted list of the 2-4 anomalies from the scan that mattered to the verdict — pulled from .cache/<TICKER>.json or anomaly-scan output>

## Cross-questioning (if any)
<Q&A pairs — useful for philosophy-refresh later>

## Open follow-ups
<things the user wants to revisit if reality changes — e.g. "revisit if they de-leverage by FY26">
```

If a decisions file already exists for this ticker and date, suffix with `-2`, `-3` rather than overwriting.

## Step 5: update shortlist

```bash
python tools/lib/shortlist.py update <TICKER> <accepted|rejected> --note "<one-line summary of the verdict>"
```

## Step 6: trigger philosophy refresh

After saving, invoke the `philosophy-refresh` skill so the next research run benefits. Just say "Running philosophy-refresh now…" and call it.

## What to avoid

- Don't second-guess the user's verdict. Probe the *reasoning*, not the *conclusion*.
- Don't moralise ("you should have done more research"). Capture, then move on.
- Don't pad the decision file. It's an audit trail, not an essay.
