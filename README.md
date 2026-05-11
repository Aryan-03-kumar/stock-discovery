# stock-discovery

A research copilot for **fundamental discovery on Indian stocks (NSE/BSE)**. Translates a sector thesis into companies, runs anomaly scans on 10-12 years of financials, supports cross-stock Q&A mid-flow, and learns from your accept/reject reasons over time.

It is **not** a stock picker, **not** a screener, and **not** a technical-analysis tool. You stay in the driver's seat — the system brings the inputs.

> **See [docs/walkthrough.pdf](docs/walkthrough.pdf)** for an end-to-end walkthrough with real Screener data — turn-by-turn transcript of what the experience actually feels like.

## Two ways to use it

| | Where it runs | Setup | Persistence |
|---|---|---|---|
| **Claude.ai chat (recommended for non-technical users)** | claude.ai web/mobile | Upload [claude-ai-skill/stock-research](claude-ai-skill/stock-research) once | Hosted backend ([backend/](backend/)) on Vercel, automatic |
| **Claude Code plugin** | Local terminal | Clone repo, `pip install`, symlink into `~/.claude/plugins/` | Local markdown files in this repo |

The two surfaces share the same 6-skill design and Screener data pipeline — they just differ in where state lives.

### For claude.ai users

1. Visit **https://stock-discovery.vercel.app** and click **Generate my skill**.
2. Save the token shown — it's your only access. Lose it, lose your state.
3. Download the personalized skill zip.
4. In claude.ai → Settings → Capabilities → Skills → Upload, drop the zip.
5. Make sure **Code Execution** is enabled.
6. Open a chat. Start typing your sector thesis.

The backend lives at https://stock-discovery.vercel.app and stores per-user state in Vercel Blob. Nothing exposed without your bearer token.

**One thing to know upfront:** conversations are logged. Every skill invocation writes a JSONL entry under your namespace — full user message, first 500 chars of the skill's response, sector, flow, duration. Logs help the maintainer (Aryan) improve the skill. You can read your own logs at `GET /api/logs?date=YYYY-MM-DD` or export everything via `GET /api/logs/export?since=...`. See [docs/logging.md](#logging) below.

### For Claude Code users

See **Install** below.

---

## How it fits together

```
                    ┌─────────────────────┐
You pick a sector →│ thesis-to-products  │ → list of investable sub-themes
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
   You pick a    →│   find-companies    │ → 6-12 NSE/BSE tickers
   sub-theme       └─────────────────────┘     (saved to state/shortlist.md)
                              │
                              ▼
                    ┌─────────────────────┐
                  →│   anomaly-scan      │ → BS/P&L/CF anomalies per ticker
                    └─────────────────────┘     (10-12 yrs, Screener-sourced)
                              │
                              ├──→ ┌──────────┐  Ad-hoc cross-stock questions
                              │    │ compare  │  ("D/E across these 10?")
                              │    └──────────┘  Callable any time, mid-flow.
                              ▼
                    ┌─────────────────────┐
   You accept/    →│      decide         │ → audit-trail in decisions/
   reject + reason  └─────────────────────┘     (cross-questions thin reasons)
                              │
                              ▼
                    ┌─────────────────────┐
                    │ philosophy-refresh  │ → updates memory/philosophy.md
                    └─────────────────────┘     (loaded into every future run)
```

---

## Install

You'll need **Claude Code** and **Python 3.10+**.

```bash
# 1. Clone
git clone <this-repo> stock-discovery
cd stock-discovery

# 2. Python deps for the data tools
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Tell Claude Code about the plugin
# Option A — symlink into your plugins dir:
ln -s "$(pwd)" ~/.claude/plugins/stock-discovery

# Option B — install via Claude Code CLI:
claude plugin install $(pwd)
```

Restart Claude Code. The 6 skills should now auto-trigger when you describe what you want, or you can invoke them by name.

---

## Worked example (10 minutes end-to-end)

In Claude Code, in this directory:

**1. Translate a thesis to sub-themes**

> "Use thesis-to-products. Sector: Indian defence manufacturing. Thesis: indigenisation tailwind from MoD orders. Horizon: 3-5 years."

You'll get a table of sub-themes — drones / loitering munitions, artillery systems, avionics, shipbuilding sub-systems, optronics, etc.

**2. Get tickers for one sub-theme**

> "Use find-companies on loitering munitions / drones. Show primary, auxiliary, and adjacent."

You'll get 6-12 NSE tickers split across the three buckets, all appended to `state/shortlist.md` as `candidate`.

**3. Scan all of them**

> "Run anomaly-scan on all candidates."

For each ticker: 10-12 years of P&L / BS / CF pulled from Screener.in, anomalies flagged with severity. Statuses flip to `scanned` in the shortlist. Data caches to `.cache/<TICKER>.json` for 7 days.

**4. Ask a cross-stock question, mid-flow**

> "Use compare. What's the debt-to-equity and 5-yr revenue CAGR across these companies?"

Returns a markdown table with both metrics + a paragraph naming the outliers. Reuses the cached data — no re-fetching.

**5. Decide on each one**

> "Use decide. Reject PARAS.NS — receivables grew 3.5× in 4 years while revenue grew 1.6×, signals collection issues."

The `decide` skill saves the verdict to `decisions/PARAS.NS/<date>.md`, updates the shortlist, and runs `philosophy-refresh`.

If you give a thin reason ("looks weak"), it'll cross-question you before saving — exactly the management-vs-demand pattern you described.

**6. Compound**

After 5-10 decisions, `memory/philosophy.md` will contain a distilled prescriptive summary of your investment style. Every subsequent run of `find-companies`, `anomaly-scan`, and `compare` loads it as context, so suggestions and flags get sharper over time.

---

## File map

```
.claude-plugin/plugin.json    # plugin manifest
skills/                       # six SKILL.md files, one per capability
tools/                        # python: data fetchers + state helpers
  fetch_screener.py             # screener.in scraper, 7-day cache
  fetch_yfinance.py             # ticker validation fallback
  lib/normalize.py              # canonical JSON shape
  lib/shortlist.py              # state/shortlist.md read/write
state/shortlist.md            # current working set (hand-editable)
decisions/<TICKER>/<date>.md  # audit trail of accept/reject reasons
memory/criteria.md            # your anomaly checklist (edit freely)
memory/philosophy.md          # auto-distilled from decisions
.cache/                       # gitignored fetch cache
```

---

## Editing the criteria

`memory/criteria.md` is the anomaly checklist. Anomaly-scan reads it on every run. If you find yourself constantly overriding the same defaults, just edit the file — every skill picks it up immediately.

---

## What's not in v0

- No web app / UI. Chat is the interface.
- No technical analysis (you do that yourself, after this).
- No live prices, portfolio tracking, or P&L.
- No multi-user. This is a personal research repo.
- No 25-year history yet — Screener gives ~10-12 years free, which is enough to get started. If you need deeper, swap `fetch_screener.py` for a paid source (FMP, TIKR, Screener Pro) — the rest of the system doesn't change.

---

## Logging

Every skill invocation against the hosted backend writes one log entry. The maintainer uses these to improve the skill over time. Stored per user at `users/<token>/logs/<YYYY-MM-DD>.jsonl` in Vercel Blob.

**Entry shape** (summary mode — full user message, first 500 chars of response, plus metadata):

```jsonc
{
  "id": "uuid",
  "conversation_id": "conv_2026-05-11_abc",
  "ts": "2026-05-11T14:32:18Z",
  "flow": "find-companies",
  "sector": "rolling-stock",
  "user_message": "Find me companies for VB sleeper coaches",
  "response_summary": "Primary: TITAGARH.NS, JWL.NS, ...",
  "response_length": 4800,
  "metadata": { "tickers_added": 8 },
  "duration_ms": 4200
}
```

**Reading your own logs** (claude.ai users — substitute your token):

```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" https://stock-discovery.vercel.app/api/logs
curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://stock-discovery.vercel.app/api/logs?date=2026-05-11"
curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://stock-discovery.vercel.app/api/logs/export?since=2026-05-01" > logs.jsonl
```

**Owner-side bulk export** (maintainer only — requires `BLOB_READ_WRITE_TOKEN`):

```bash
cd backend
npx vercel env pull                  # populates .env.local
npm run dump-logs                    # writes dist/logs/<userId>/<date>.jsonl
```

No admin endpoint is exposed on the public internet. The maintainer can read all users' logs because they own the Vercel project; outside attackers cannot pivot from a leaked user token to other users' data.

**Quota:** ~1-2 KB per entry. Heavy use of 50 flows/day = ~36 MB/year per user. Free tier supports decades.

---

## Troubleshooting

**Screener returns 404 for a ticker** — it may only have a standalone (not consolidated) page. The fetcher retries automatically; if both fail, the ticker may be delisted or wrong.

**`yfinance` import error** — make sure you `pip install -r requirements.txt` inside the venv before running Claude Code.

**Skills not triggering** — restart Claude Code after `claude plugin install`. Check the skill is listed in the system prompt's available-skills section.

**Decisions piling up but philosophy.md looks stale** — call the `philosophy-refresh` skill manually. The `decide` skill triggers it after each save, but if you hand-edit decisions, you need to refresh yourself.

---

## License

MIT — do whatever, just don't blame the plugin for your trades.
