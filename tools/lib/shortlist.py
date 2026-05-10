"""Read/append/update helpers for state/shortlist.md.

The file is a markdown table the user can hand-edit. We parse it line-by-line.
"""

from __future__ import annotations

from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SHORTLIST = REPO_ROOT / "state" / "shortlist.md"

HEADER = """# Shortlist

Living list of tickers under research. Statuses: `candidate`, `scanned`, `accepted`, `rejected`.

| Ticker | Source | Status | Last Touched | Note |
|--------|--------|--------|--------------|------|
"""


def _ensure() -> None:
    if not SHORTLIST.exists():
        SHORTLIST.parent.mkdir(parents=True, exist_ok=True)
        SHORTLIST.write_text(HEADER, encoding="utf-8")


def _parse_rows() -> list[dict]:
    _ensure()
    rows = []
    for line in SHORTLIST.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or line.startswith("|---") or line.startswith("| Ticker"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 5:
            continue
        rows.append({
            "ticker": cells[0],
            "source": cells[1],
            "status": cells[2],
            "last_touched": cells[3],
            "note": cells[4],
        })
    return rows


def _write_rows(rows: list[dict]) -> None:
    body = HEADER
    for r in rows:
        body += f"| {r['ticker']} | {r['source']} | {r['status']} | {r['last_touched']} | {r['note']} |\n"
    SHORTLIST.write_text(body, encoding="utf-8")


def read() -> list[dict]:
    return _parse_rows()


def add(ticker: str, source: str, note: str = "") -> None:
    rows = _parse_rows()
    ticker = ticker.upper()
    for r in rows:
        if r["ticker"] == ticker:
            return
    rows.append({
        "ticker": ticker,
        "source": source,
        "status": "candidate",
        "last_touched": date.today().isoformat(),
        "note": note,
    })
    _write_rows(rows)


def update_status(ticker: str, status: str, note: str | None = None) -> bool:
    rows = _parse_rows()
    ticker = ticker.upper()
    for r in rows:
        if r["ticker"] == ticker:
            r["status"] = status
            r["last_touched"] = date.today().isoformat()
            if note is not None:
                r["note"] = note
            _write_rows(rows)
            return True
    return False


def list_by_status(status: str) -> list[dict]:
    return [r for r in _parse_rows() if r["status"] == status]


if __name__ == "__main__":
    import argparse, json
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("read")
    a = sub.add_parser("add")
    a.add_argument("ticker"); a.add_argument("source"); a.add_argument("--note", default="")
    u = sub.add_parser("update")
    u.add_argument("ticker"); u.add_argument("status"); u.add_argument("--note", default=None)
    lb = sub.add_parser("by-status"); lb.add_argument("status")
    args = p.parse_args()

    if args.cmd == "read":
        print(json.dumps(read(), indent=2))
    elif args.cmd == "add":
        add(args.ticker, args.source, args.note)
        print(f"added {args.ticker}")
    elif args.cmd == "update":
        ok = update_status(args.ticker, args.status, args.note)
        print("ok" if ok else "ticker not found")
    elif args.cmd == "by-status":
        print(json.dumps(list_by_status(args.status), indent=2))
