"""Canonical shape for fetched financials, used by every fetcher."""

from __future__ import annotations

from datetime import datetime, timezone


def empty_payload(ticker: str, source: str) -> dict:
    return {
        "ticker": ticker.upper(),
        "company_name": None,
        "source": source,
        "currency": "INR",
        "scale": "crore",
        "years": [],
        "statements": {
            "pnl": {},
            "balance_sheet": {},
            "cash_flow": {},
            "ratios": {},
            "quarters": {},
        },
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def parse_number(text: str):
    """Parse Screener-style numeric strings: '1,234', '1,234.5', '-1,234', '12%', '—', ''."""
    if text is None:
        return None
    s = text.strip().replace(",", "").replace("₹", "").replace("%", "")
    if s in ("", "-", "—", "–"):
        return None
    try:
        return float(s)
    except ValueError:
        return None
