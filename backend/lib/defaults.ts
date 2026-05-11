import type { State } from "./types";

export const DEFAULT_CRITERIA = `# Anomaly criteria

Default checklist used by the anomaly-scan and compare flows. Edit freely.

## P&L
- Expense growth > revenue growth for 2+ consecutive years (margin compression).
- Other income > 25% of PBT in any year (earnings quality risk).
- Exceptional items appearing in 3+ of last 10 yrs.
- Tax rate swinging by >10pp year-on-year without a known statutory cause.

## Balance Sheet
- Borrowings rising while equity flat / declining.
- Receivables growing materially faster than revenue for 2+ years.
- Inventory growing faster than revenue for 2+ years.
- Goodwill / intangibles spiking without commensurate revenue or margin lift.
- Reserves flat or declining despite reported profits.
- CWIP sitting on the books for 3+ years without converting to fixed assets.

## Cash Flow
- CFO < reported PAT for 3+ consecutive years.
- Capex spike in a year, followed by no revenue lift in the next 2 years.
- Debt issued + equity diluted in the same year as positive operating cash flow.
- Investing cash flow consistently absorbing more than depreciation.

## Cross-statement
- PAT growing while OCF flat (earnings quality flag).
- Asset turnover declining over 5+ years.
- Fixed-asset intensity rising, revenue per asset falling.
- Working capital days trending up over 5 yrs.

## Ratios
- D/E > 1.5 (concerning unless PLI / regulated sector).
- ROCE < cost of capital (~12%) for 3+ years.
- Promoter pledging > 30% — auto-disqualifier unless explicit reason.
- Promoter holding trending down without disclosure.

## Not flagged
- COVID-distorted years (FY20-FY21) unless persisted past FY23.
- Single-year exceptional events with full disclosure.
- Sector-wide cyclical downturns.
`;

export const DEFAULT_PHILOSOPHY = `# Investment Philosophy

> This file is rewritten by the refresh-philosophy flow after each accept/reject decision.
> It will look empty until the first few decisions accumulate.

## Disqualifiers
_(none yet)_

## Strong negatives
_(none yet)_

## Strong positives
_(none yet)_

## Treated as noise
_(none yet)_

## Subjectivity dimensions
_(none yet)_

## Recent verdicts at a glance
_(none yet)_
`;

export function defaultState(): State {
  return {
    shortlist: [],
    decisions: [],
    philosophy: DEFAULT_PHILOSOPHY,
    criteria: DEFAULT_CRITERIA,
  };
}
