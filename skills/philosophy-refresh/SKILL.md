---
name: philosophy-refresh
description: Read all past accept/reject decisions and rewrite memory/philosophy.md — the distilled summary of what the user values, what they reject, what they treat as red flags, what they treat as noise. Called automatically by the decide skill after each verdict, but can also be run manually after editing decision files. Triggers on "refresh philosophy", "update my philosophy", "re-distil my decisions".
---

# philosophy-refresh

You are reading every decision the user has made and producing a tight, *prescriptive* summary of how they think. This file is the single most important context that gets loaded into every other skill, so quality matters more than length.

## Inputs

None. Read everything in `decisions/**/*.md`.

## Step 1: read all decisions

```bash
ls decisions/*/*.md  # to enumerate
```

Read each file. Extract:

- The verdict (accept / reject)
- The full reason
- The anomalies that drove it
- Any cross-questioning Q&A

If there are zero decisions, write an empty `philosophy.md` with a placeholder header and stop.

## Step 2: distil

You are looking for **patterns across decisions**, not summarising each one. Cluster what you see into:

### Disqualifiers (things that alone get rejected)
e.g. "Promoter pledging > 30%", "Receivables growing >2× revenue growth for 3+ years", "Companies that diluted >20% in 5 yrs without a clear capex story"

### Strong negatives (count against, but not alone)
e.g. "Capex spike with no follow-through revenue lift within 2 yrs", "OCF / PAT < 0.6 sustained"

### Strong positives
e.g. "Promoter-led with skin in the game", "Asset-light models pivoting into the thesis", "Companies with a turnaround story backed by cash-flow improvement, not P&L cosmetics"

### Patterns the user treats as noise (NOT red flags)
e.g. "FY20 / FY21 anomalies due to COVID — ignore unless they persisted past FY23", "One-time exceptional items don't disqualify"

### Subjectivity dimensions
The user's frequently-cited frames. e.g.:
- "Management *didn't try* vs *tried and failed* (demand absent) — only the first kills the thesis"
- "Sector pivot vs forced product-market mismatch"
- (Add the user's own framings as you encounter them)

## Step 3: write `memory/philosophy.md`

Replace the file completely (don't append — this is a fresh distillation each time). Format:

```markdown
# Investment Philosophy

> Distilled from <N> decisions across <M> tickers. Last refreshed <date>.

## Disqualifiers
- ...

## Strong negatives
- ...

## Strong positives
- ...

## Treated as noise
- ...

## Subjectivity dimensions
- ...

## Recent verdicts at a glance
| Ticker | Verdict | Date | Why (one line) |
|---|---|---|---|
<last 10 decisions, most recent first>
```

## Rules

- **Be prescriptive, not descriptive.** "User rejects high-debt companies" is weaker than "Reject if D/E > 1.5 unless capex is in PLI-backed sectors."
- **Quote the user's framings verbatim** when they invented one — those are gold. e.g. "the management was 'flapping arms and legs'" if that's how he described it.
- **Don't smooth out contradictions.** If the user accepted high-debt for one company and rejected it for another, surface the distinction (probably the first had a turnaround story; describe both).
- **Keep it under ~400 lines.** This file gets loaded into every skill — bloat hurts every other run.
- **Date and decision-count footer.** So future-you can see it's stale.
