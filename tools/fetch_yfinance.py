"""Resolve / validate an Indian ticker via yfinance and return basic profile info.

Usage:
    python tools/fetch_yfinance.py PARAS.NS

Used as a fallback when Screener doesn't have a company, or as a sanity check on
ticker symbols. Default suffix is .NS (NSE); falls back to .BO (BSE) if .NS is
empty.
"""

from __future__ import annotations

import argparse
import json
import sys

import yfinance as yf


def _try(symbol: str) -> dict | None:
    t = yf.Ticker(symbol)
    info = t.info or {}
    if not info or info.get("regularMarketPrice") is None and not info.get("longName"):
        return None
    return {
        "symbol": symbol,
        "long_name": info.get("longName"),
        "short_name": info.get("shortName"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "market_cap": info.get("marketCap"),
        "currency": info.get("currency"),
        "exchange": info.get("exchange"),
        "website": info.get("website"),
    }


def resolve(ticker: str) -> dict:
    base = ticker.upper().split(".")[0]
    for suffix in (".NS", ".BO"):
        result = _try(base + suffix)
        if result:
            return result
    return {"symbol": ticker, "error": "not_found"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("ticker")
    args = ap.parse_args()
    print(json.dumps(resolve(args.ticker), indent=2, default=str))


if __name__ == "__main__":
    main()
