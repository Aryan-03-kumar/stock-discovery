# stock-research (claude.ai skill)

A bundled Claude skill that gives you a fundamental-research copilot for Indian stocks. Designed for use on **claude.ai** (the chat interface) — no terminal, no install, no API keys.

State (shortlist, decisions, learned philosophy) persists across conversations via a small backend.

## How to upload

1. Sign in to [claude.ai](https://claude.ai) with your free or Pro account.
2. Go to **Settings → Capabilities → Skills**.
3. Click **Upload skill**.
4. Drop this folder (`stock-research/`) — or zip it first and upload the zip.
5. Done. Open any chat and start typing.

> Make sure **Code Execution** is enabled in your account (Settings → Capabilities). The skill uses Python under the hood to call its backend.

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

- `SKILL.md` — the brain. Defines all 6 flows.
- `scripts/api.py` — the backend client. Your user token is baked in here.

## Privacy

Your state (shortlist, decisions, philosophy) is stored under a token that only you have. Nobody else can read it. The backend is open source — see [github.com/Aryan-03-kumar/stock-discovery](https://github.com/Aryan-03-kumar/stock-discovery).
