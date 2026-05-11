export type Status = "candidate" | "scanned" | "accepted" | "rejected";

export interface ShortlistEntry {
  ticker: string;
  source: string;
  status: Status;
  last_touched: string;
  note: string;
}

export interface DecisionEntry {
  ticker: string;
  verdict: "accept" | "reject";
  date: string;
  reason: string;
  anomalies: string[];
  cross_questioning: string;
  open_follow_ups: string;
  status_before: Status | "unknown";
}

export interface State {
  shortlist: ShortlistEntry[];
  decisions: DecisionEntry[];
  philosophy: string;
  criteria: string;
}

export interface FinancialsCache {
  ticker: string;
  company_name: string | null;
  source: string;
  currency: string;
  scale: string;
  years: string[];
  statements: {
    pnl: Record<string, (number | null)[]>;
    balance_sheet: Record<string, (number | null)[]>;
    cash_flow: Record<string, (number | null)[]>;
    ratios: Record<string, (number | null)[]>;
    quarters: Record<string, (number | null)[]>;
  };
  statement_years: Record<string, string[]>;
  fetched_at: string;
}
