"""Scrape standardized financials from screener.in for an Indian ticker.

Usage:
    python tools/fetch_screener.py PARAS.NS
    python tools/fetch_screener.py PARAS.NS --no-cache
    python tools/fetch_screener.py PARAS.NS --consolidated

Caches results to .cache/<TICKER>.json with a 7-day TTL. Outputs canonical JSON
to stdout so skills can pipe it into prompts.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.normalize import empty_payload, parse_number  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = REPO_ROOT / ".cache"
CACHE_TTL = timedelta(days=7)
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
BASE = "https://www.screener.in/company"


def _cache_path(ticker: str) -> Path:
    return CACHE_DIR / f"{ticker.upper()}.json"


def _read_cache(ticker: str):
    p = _cache_path(ticker)
    if not p.exists():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        fetched = datetime.fromisoformat(data["fetched_at"])
        if datetime.now(timezone.utc) - fetched < CACHE_TTL:
            return data
    except (json.JSONDecodeError, KeyError, ValueError):
        return None
    return None


def _write_cache(payload: dict) -> None:
    CACHE_DIR.mkdir(exist_ok=True)
    _cache_path(payload["ticker"]).write_text(
        json.dumps(payload, indent=2), encoding="utf-8"
    )


def _strip_suffix(ticker: str) -> str:
    """Screener URLs use the bare symbol, no .NS / .BO suffix."""
    return ticker.upper().split(".")[0]


def _parse_section(soup: BeautifulSoup, section_id: str) -> tuple[list[str], dict]:
    section = soup.find(id=section_id)
    if not section:
        return [], {}
    table = section.find("table")
    if not table:
        return [], {}
    headers = [th.get_text(strip=True) for th in table.find("thead").find_all("th")]
    years = headers[1:]
    rows: dict = {}
    for tr in table.find("tbody").find_all("tr"):
        cells = tr.find_all(["td", "th"])
        if not cells:
            continue
        label = cells[0].get_text(strip=True).rstrip("+").strip()
        if not label:
            continue
        rows[label] = [parse_number(c.get_text()) for c in cells[1:]]
    return years, rows


def fetch(ticker: str, consolidated: bool = True) -> dict:
    symbol = _strip_suffix(ticker)
    url = f"{BASE}/{symbol}/{'consolidated/' if consolidated else ''}"
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
    if resp.status_code == 404 and consolidated:
        return fetch(ticker, consolidated=False)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    payload = empty_payload(ticker, source=url)
    name = soup.find("h1")
    if name:
        payload["company_name"] = name.get_text(strip=True)

    pnl_years, pnl = _parse_section(soup, "profit-loss")
    bs_years, bs = _parse_section(soup, "balance-sheet")
    cf_years, cf = _parse_section(soup, "cash-flow")
    ratio_years, ratios = _parse_section(soup, "ratios")
    q_years, quarters = _parse_section(soup, "quarters")

    payload["years"] = pnl_years or bs_years or cf_years
    payload["statements"]["pnl"] = pnl
    payload["statements"]["balance_sheet"] = bs
    payload["statements"]["cash_flow"] = cf
    payload["statements"]["ratios"] = ratios
    payload["statements"]["quarters"] = quarters
    payload["statement_years"] = {
        "pnl": pnl_years,
        "balance_sheet": bs_years,
        "cash_flow": cf_years,
        "ratios": ratio_years,
        "quarters": q_years,
    }
    return payload


def get(ticker: str, use_cache: bool = True, consolidated: bool = True) -> dict:
    if use_cache:
        cached = _read_cache(ticker)
        if cached:
            return cached
    payload = fetch(ticker, consolidated=consolidated)
    _write_cache(payload)
    time.sleep(1.5)  # be polite to screener
    return payload


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("ticker", help="NSE ticker, e.g. PARAS.NS or just PARAS")
    ap.add_argument("--no-cache", action="store_true")
    ap.add_argument("--consolidated", action="store_true", default=True)
    ap.add_argument("--standalone", dest="consolidated", action="store_false")
    args = ap.parse_args()

    try:
        data = get(args.ticker, use_cache=not args.no_cache, consolidated=args.consolidated)
    except requests.HTTPError as e:
        print(json.dumps({"error": "http", "status": e.response.status_code, "ticker": args.ticker}))
        sys.exit(1)
    except requests.RequestException as e:
        print(json.dumps({"error": "network", "message": str(e), "ticker": args.ticker}))
        sys.exit(1)
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
