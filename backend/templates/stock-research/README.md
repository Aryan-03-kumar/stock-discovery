# stock-research (claude.ai skill)

A bundled Claude skill that gives you a fundamental-research copilot for Indian stocks. Designed for use on **claude.ai** (the chat interface) — no terminal, no install, no API keys.

State (shortlist, decisions, learned philosophy) persists across conversations via a small backend.

## How to get your own copy

1. Visit **[stock-discovery.vercel.app](https://stock-discovery.vercel.app)**.
2. Click **Generate my skill**.
3. Save the token shown (you can't recover it later).
4. Click **Download skill zip** — it's pre-personalized with your token.

## How to upload to claude.ai

1. Sign in to [claude.ai](https://claude.ai).
2. Go to **Settings → Capabilities → Skills**.
3. Click **Upload skill**, drop the zip (or the unzipped folder).
4. Make sure **Code Execution** is enabled (Settings → Capabilities). The skill runs Python to call its backend.
5. Open any chat and start typing.

## How to use

Just chat naturally:

> *"I'm bullish on Indian railway modernisation post the FY26 budget. Help me find stocks."*

The skill will:

1. Ask you to refine the thesis if needed.
2. Suggest sub-themes that capture the growth.
3. After you pick one, find 6-12 NSE/BSE tickers (primary + auxiliary + adjacent).
4. Scan any ticker's 10-12 years of financials for anomalies.
5. Answer cross-stock comparison questions on demand.
6. Capture your accept/reject decisions — and push back when your reasoning is thin.
7. Learn from your decisions over time so every future research run gets sharper.

You can ask it anything mid-flow: *"what's the D/E across these 8 tickers?"* — it'll answer without breaking the workflow.

## What it explicitly doesn't do

- Technical analysis or charting
- Price predictions
- Buy/sell recommendations
- Stock scoring

You stay the decision-maker.

## Files in this skill

- `SKILL.md` — the brain. Defines all 6 flows and the sector model.
- `scripts/api.py` — the backend client. Your user token is baked in here at download time.

## Sector-segmented learning

Each decision you make is tagged with a sector (`defence`, `rolling-stock`, `pharma-cdmo`, etc.). The skill maintains two layers of learned philosophy:

- **Universal:** lenses that have shown up in decisions across 2+ sectors.
- **Per-sector:** lenses specific to one sector — different D/E thresholds for defence vs. tech, different OCF/PAT expectations for real estate vs. SaaS.

When you research a new theme, the skill loads `universal + <that sector>` — not a one-size-fits-all philosophy that bleeds defence lenses into pharma analysis.

## Privacy

Your state (shortlist, decisions, philosophy) is stored under a token that only you have. Other users with their own tokens cannot read or write your namespace. The backend is open source: [github.com/Aryan-03-kumar/stock-discovery](https://github.com/Aryan-03-kumar/stock-discovery).

**Lose the token = lose the state.** There's no recovery, no email, no password. Treat it like a wallet seed phrase.

**One thing to know upfront — conversations are logged.** Every skill invocation writes a log entry under your namespace: the literal user message, the first 500 characters of the skill's response, the sector, flow, and duration. These logs help the maintainer (Aryan) improve the skill over time by identifying where it stumbles.

You can read your own logs anytime:

```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  https://stock-discovery.vercel.app/api/logs
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  "https://stock-discovery.vercel.app/api/logs?date=2026-05-11"
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  "https://stock-discovery.vercel.app/api/logs/export?since=2026-05-01" \
  > my-logs.jsonl
```

The maintainer can read all users' logs because they own the Vercel project that hosts the backend — there's no separate admin endpoint exposed on the public internet. If you'd rather not be logged at all, self-host the backend (the source is MIT) and point your skill at your own URL.
