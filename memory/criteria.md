# Anomaly criteria

Default checklist used by `anomaly-scan` and `compare`. Edit freely — every skill reads this file before scanning.

## P&L

- **Expense growth > revenue growth** for 2+ consecutive years (margin compression).
- **Other income > 25% of PBT** in any year (earnings quality risk).
- **Exceptional items** appearing in 3+ of last 10 yrs (management may be using them to manage reported profit).
- **Tax rate** swinging by >10pp year-on-year without a known statutory cause.

## Balance Sheet

- **Borrowings** rising while equity flat / declining.
- **Receivables** growing materially faster than revenue for 2+ years (channel-stuffing / collection issues).
- **Inventory** growing faster than revenue for 2+ years (demand softening).
- **Goodwill / intangibles** spiking without commensurate revenue or margin lift (acquisition not earning out).
- **Reserves** flat or declining despite reported profits (where is the cash going?).
- **CWIP** (capital work in progress) sitting on the books for 3+ years without converting to fixed assets.

## Cash Flow

- **CFO < reported PAT** for 3+ consecutive years (low earnings quality).
- **Capex spike** in a year, followed by no revenue lift in the next 2 years.
- **Debt issued + equity diluted** in the same year as positive operating cash flow (why raise if you don't need to?).
- **Investing cash flow** consistently absorbing more than depreciation (running to stand still).

## Cross-statement

- **PAT growing while OCF flat** — earnings quality flag.
- **Asset turnover** declining over 5+ years (deploying more capital for the same revenue).
- **Fixed-asset intensity** rising, revenue per asset falling.
- **Working capital days** (debtor + inventory − creditor) trending up over 5 yrs.

## Ratios (from Screener)

- **D/E > 1.5** (concerning unless PLI / regulated sector).
- **ROCE < cost of capital (~12%)** for 3+ years.
- **Promoter pledging > 30%** — auto-disqualifier unless explicit reason.
- **Promoter holding** trending down without disclosure.

## What to *not* flag

- COVID-distorted years (FY20-FY21) unless the issue persisted past FY23.
- Single-year exceptional events with full disclosure (settlements, divestments).
- Sector-wide cyclical downturns where peers also moved together.
