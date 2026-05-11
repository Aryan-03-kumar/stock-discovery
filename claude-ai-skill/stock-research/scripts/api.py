"""Thin client for the stock-research backend.

The friend's user token and the backend URL are baked in below before delivery.
Replace the placeholders with the real values you receive from Aryan, or leave
them and set the STOCK_RESEARCH_API / STOCK_RESEARCH_TOKEN env vars instead.
"""

from __future__ import annotations

import json
import os
from typing import Any
from urllib import request as _req
from urllib.error import HTTPError, URLError

# === Replace USER_TOKEN before distributing to a specific user ===
_DEFAULT_API = "https://stock-discovery.vercel.app"
_DEFAULT_TOKEN = "__USER_TOKEN_HERE__"
# =================================================================

API_BASE = os.environ.get("STOCK_RESEARCH_API", _DEFAULT_API).rstrip("/")
USER_TOKEN = os.environ.get("STOCK_RESEARCH_TOKEN", _DEFAULT_TOKEN)


class APIError(RuntimeError):
    pass


def set_creds(api_base: str | None = None, token: str | None = None) -> None:
    """Override credentials at runtime (rarely needed)."""
    global API_BASE, USER_TOKEN
    if api_base:
        API_BASE = api_base.rstrip("/")
    if token:
        USER_TOKEN = token


def _call(method: str, path: str, body: dict[str, Any] | None = None) -> Any:
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = _req.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {USER_TOKEN}")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with _req.urlopen(req, timeout=30) as resp:
            payload = resp.read().decode("utf-8")
            return json.loads(payload) if payload else {}
    except HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise APIError(f"{method} {path} → {e.code}: {detail}") from e
    except URLError as e:
        raise APIError(f"{method} {path} → network error: {e.reason}") from e


# === State ===

def get_state() -> dict[str, Any]:
    """Return everything: shortlist, decisions, philosophy, criteria."""
    return _call("GET", "/api/state")


# === Shortlist ===

def get_shortlist(status: str | None = None) -> list[dict[str, Any]]:
    path = "/api/shortlist" + (f"?status={status}" if status else "")
    return _call("GET", path)["shortlist"]


def add_to_shortlist(ticker: str, source: str, note: str = "") -> dict[str, Any]:
    return _call("POST", "/api/shortlist", {"ticker": ticker, "source": source, "note": note})


def update_shortlist_status(ticker: str, status: str, note: str | None = None) -> dict[str, Any]:
    body: dict[str, Any] = {"status": status}
    if note is not None:
        body["note"] = note
    return _call("PATCH", f"/api/shortlist/{ticker}", body)


def remove_from_shortlist(ticker: str) -> dict[str, Any]:
    return _call("DELETE", f"/api/shortlist/{ticker}")


# === Decisions ===

def list_decisions(ticker: str | None = None) -> list[dict[str, Any]]:
    path = "/api/decisions" + (f"?ticker={ticker}" if ticker else "")
    return _call("GET", path)["decisions"]


def save_decision(
    ticker: str,
    verdict: str,
    reason: str,
    anomalies: list[str] | None = None,
    cross_questioning: str = "",
    open_follow_ups: str = "",
) -> dict[str, Any]:
    return _call("POST", "/api/decisions", {
        "ticker": ticker,
        "verdict": verdict,
        "reason": reason,
        "anomalies": anomalies or [],
        "cross_questioning": cross_questioning,
        "open_follow_ups": open_follow_ups,
    })


# === Philosophy & criteria ===

def get_philosophy() -> str:
    return _call("GET", "/api/philosophy")["philosophy"]


def put_philosophy(philosophy: str) -> dict[str, Any]:
    return _call("PUT", "/api/philosophy", {"philosophy": philosophy})


def get_criteria() -> str:
    return _call("GET", "/api/criteria")["criteria"]


def put_criteria(criteria: str) -> dict[str, Any]:
    return _call("PUT", "/api/criteria", {"criteria": criteria})


# === Financials ===

def get_financials(ticker: str, refresh: bool = False) -> dict[str, Any]:
    """Pull 10-12 yrs P&L / BS / CF / Ratios. Returns from cache (7-day TTL)
    unless refresh=True."""
    path = f"/api/financials/{ticker}" + ("?refresh=1" if refresh else "")
    return _call("GET", path)
