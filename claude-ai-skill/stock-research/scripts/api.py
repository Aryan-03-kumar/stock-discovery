"""Thin client for the stock-research backend.

The user token is baked into _DEFAULT_TOKEN at download time by the backend's
download-bundle endpoint. Don't edit unless you're regenerating manually.
"""

from __future__ import annotations

import json
import os
import time
import uuid
from typing import Any
from urllib import request as _req
from urllib.error import HTTPError, URLError

# === Substituted at download time by /api/download-bundle ===
_DEFAULT_API = "https://stock-discovery.vercel.app"
_DEFAULT_TOKEN = "__USER_TOKEN_HERE__"
# ============================================================

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
    """Return everything: shortlist, decisions, philosophy (object), criteria."""
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

def list_decisions(ticker: str | None = None, sector: str | None = None) -> list[dict[str, Any]]:
    qs = []
    if ticker:
        qs.append(f"ticker={ticker}")
    if sector:
        qs.append(f"sector={sector}")
    path = "/api/decisions" + (f"?{'&'.join(qs)}" if qs else "")
    return _call("GET", path)["decisions"]


def save_decision(
    ticker: str,
    verdict: str,
    sector: str,
    reason: str,
    anomalies: list[str] | None = None,
    cross_questioning: str = "",
    open_follow_ups: str = "",
) -> dict[str, Any]:
    """Save an accept/reject decision. `sector` is required — use a lowercase
    hyphenated slug like 'defence', 'rolling-stock', 'pharma-cdmo'."""
    return _call("POST", "/api/decisions", {
        "ticker": ticker,
        "verdict": verdict,
        "sector": sector,
        "reason": reason,
        "anomalies": anomalies or [],
        "cross_questioning": cross_questioning,
        "open_follow_ups": open_follow_ups,
    })


# === Philosophy & criteria ===

def get_philosophy(sector: str | None = None) -> dict[str, Any]:
    """Without sector: returns the full philosophy object {universal, sectors}.
    With sector: returns {universal, sector_philosophy, known_sectors} ready to
    load as context for one flow."""
    path = "/api/philosophy" + (f"?sector={sector}" if sector else "")
    return _call("GET", path)


def put_philosophy(
    universal: str | None = None,
    sectors: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Partial update. Pass `universal` to overwrite the universal text. Pass
    `sectors` as a dict of slug → markdown to overwrite specific sector files.
    To delete a sector, pass that slug with an empty string."""
    body: dict[str, Any] = {}
    if universal is not None:
        body["universal"] = universal
    if sectors is not None:
        body["sectors"] = sectors
    if not body:
        raise APIError("put_philosophy: pass universal=, sectors=, or both")
    return _call("PUT", "/api/philosophy", body)


def get_criteria() -> str:
    return _call("GET", "/api/criteria")["criteria"]


def put_criteria(criteria: str) -> dict[str, Any]:
    return _call("PUT", "/api/criteria", {"criteria": criteria})


# === Logs ===
#
# Logging captures one entry per skill invocation so the maintainer can analyse
# real usage and improve the skill over time. Summary mode: user message in
# full, response truncated to ~500 chars. Failures are swallowed silently —
# logging must never break a flow.

_CONVERSATION_ID: str | None = None
_FLOW_START: dict[str, float] = {}
_RESPONSE_SUMMARY_CHARS = 500


def _conversation_id() -> str:
    """Per-session conversation id. Stays stable across calls within one
    claude.ai Code Execution session; fresh on each new chat."""
    global _CONVERSATION_ID
    if _CONVERSATION_ID is None:
        _CONVERSATION_ID = (
            "conv_" + time.strftime("%Y-%m-%d_%H%M%S") + "_" + uuid.uuid4().hex[:8]
        )
    return _CONVERSATION_ID


def start_flow(flow: str) -> float:
    """Mark the start of a flow execution. Returns a token to pass to
    log_event() so we can compute duration. Always safe to call."""
    t = time.time()
    _FLOW_START[flow] = t
    return t


def log_event(
    flow: str,
    user_message: str,
    response: str = "",
    sector: str = "",
    metadata: dict[str, Any] | None = None,
    started_at: float | None = None,
) -> None:
    """Append one log entry. Never raises — logging failures must not break
    the user-facing flow."""
    try:
        summary = response[:_RESPONSE_SUMMARY_CHARS]
        duration_ms = None
        start = started_at if started_at is not None else _FLOW_START.pop(flow, None)
        if start is not None:
            duration_ms = int((time.time() - start) * 1000)
        body: dict[str, Any] = {
            "conversation_id": _conversation_id(),
            "flow": flow,
            "sector": sector,
            "user_message": user_message[:4000],
            "response_summary": summary,
            "response_length": len(response),
            "metadata": metadata or {},
        }
        if duration_ms is not None:
            body["duration_ms"] = duration_ms
        _call("POST", "/api/logs", body)
    except Exception:  # pragma: no cover — never break the flow
        pass


# === Financials ===

def get_financials(ticker: str, refresh: bool = False) -> dict[str, Any]:
    """Pull 10-12 yrs P&L / BS / CF / Ratios. Returns from cache (7-day TTL)
    unless refresh=True."""
    path = f"/api/financials/{ticker}" + ("?refresh=1" if refresh else "")
    return _call("GET", path)
