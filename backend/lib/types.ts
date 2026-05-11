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
  sector: string;
  date: string;
  reason: string;
  anomalies: string[];
  cross_questioning: string;
  open_follow_ups: string;
  status_before: Status | "unknown";
}

export interface Philosophy {
  universal: string;
  sectors: Record<string, string>;
}

export interface State {
  shortlist: ShortlistEntry[];
  decisions: DecisionEntry[];
  philosophy: Philosophy;
  criteria: string;
}

export interface LogEntry {
  id: string;
  conversation_id: string;
  ts: string;
  flow: string;
  sector: string;
  user_message: string;
  response_summary: string;
  response_length: number;
  metadata: Record<string, unknown>;
  duration_ms?: number;
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
