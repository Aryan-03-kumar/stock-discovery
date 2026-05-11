# stock-discovery

A research copilot for **fundamental discovery on Indian stocks (NSE/BSE)**, delivered as a [claude.ai](https://claude.ai) skill. Translates a sector thesis into companies, scans 10-12 years of financials for anomalies, answers cross-stock comparison questions, and learns from your accept/reject reasons — segmented by sector — over time.

It is **not** a stock picker, **not** a screener, and **not** a technical-analysis tool. You stay the decision-maker; the skill brings the inputs.

**Live:** https://stock-discovery.vercel.app

---

## Three steps to start

1. Visit **[stock-discovery.vercel.app](https://stock-discovery.vercel.app)** and click **Generate my skill**.
2. Save your token (only chance — there's no recovery), then download the personalized skill zip.
3. In claude.ai → Settings → Capabilities → Skills, upload the zip. Make sure **Code Execution** is on. Open a chat and describe your sector thesis. The skill triggers automatically.

> The skill runs Python under the hood to call this repo's backend at `stock-discovery.vercel.app`. Your state lives in Vercel Blob keyed by your token; nobody else can read it.

---

## What it does — the 6 flows

| Flow | Triggers on | Output |
|---|---|---|
| **thesis-to-products** | "I'm bullish on X", "what products will drive growth in X" | Ranked sub-themes that operationalise your thesis |
| **find-companies** | "find me companies for X", "supply chain plays for X" | 6-12 NSE/BSE tickers, split into primary / auxiliary / adjacent |
| **anomaly-scan** | "scan X", "deep dive X's financials" | 10-12 yr Balance Sheet / P&L / Cash Flow anomalies, severity-tagged |
| **compare** | "compare these", "rank by X across the shortlist" | Side-by-side metric table with a one-paragraph observation. Callable any time, mid-flow. |
| **decide** | "accept X", "reject X" | Captures verdict + reason. Cross-questions when reasoning is thin. |
| **philosophy-refresh** | runs automatically after every `decide` | Distils all past decisions into a sector-segmented investing philosophy |

A typical session looks like: pick sector → break into sub-themes → find tickers → scan a few → compare on a metric → make a call. The next session starts with everything you've learned already loaded as context.

---

## How sector-segmented learning works

The most distinctive design decision in this repo. A lens like *"D/E > 1.5 is concerning"* applies in some sectors (asset-light tech) but is normal in others (defence, banking, infra). So the philosophy is split:

```
philosophy:
  universal     # patterns confirmed across ≥2 sectors
  sectors:
    defence:        ...
    rolling-stock:  ...
    pharma-cdmo:    ...
    ...
```

Every decision is tagged with the sector it came from. When you research a new theme, the skill loads `universal + <that-sector>` — defence lenses don't bleed into pharma analysis. A lens that appears in decisions from 2+ different sectors automatically gets promoted to `universal`. You can also hand-edit any philosophy file via `PUT /api/philosophy`.

---

## Logging

Every skill invocation writes one log entry under your namespace at `users/<token>/logs/<YYYY-MM-DD>.jsonl` in Vercel Blob. **Summary mode:** full user message + first 500 chars of the skill's response + sector + flow + duration + flow-specific metadata.

This lets the maintainer (Aryan) review usage and improve the skill over time. You can read your own logs anytime:

```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" https://stock-discovery.vercel.app/api/logs
curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://stock-discovery.vercel.app/api/logs?date=2026-05-11"
curl -H "Authorization: Bearer <YOUR_TOKEN>" "https://stock-discovery.vercel.app/api/logs/export?since=2026-05-01" > logs.jsonl
```

If you'd rather not be logged, self-host the backend (the source is MIT) and point your skill at your own URL.

---

## Owner-side log export

Only the project owner has the Vercel `BLOB_READ_WRITE_TOKEN`, so log analysis runs entirely in the owner's terminal — no admin endpoint is exposed on the public internet.

```bash
cd backend
npx vercel env pull                  # populates .env.local
npm run dump-logs                    # writes dist/logs/<userId>/<date>.jsonl
```

If an attacker leaked their own user token, they could read their own state — but never anyone else's.

---

## Repo layout

```
backend/                            # The live Vercel app (Next.js 16 + Vercel Blob)
  app/api/                          # 15 endpoints: signup, download-bundle, state,
                                    # shortlist, decisions, philosophy, criteria,
                                    # financials, logs, logs/export
  app/page.tsx                      # Self-service signup landing page
  lib/                              # auth, storage, screener scraper, defaults, types
  templates/stock-research/         # Synced from claude-ai-skill/ — what users download
  scripts/sync-skill-template.mjs   # Prebuild step
  scripts/dump-all-logs.mjs         # Owner-side log export

claude-ai-skill/stock-research/     # The source skill — SKILL.md + scripts/api.py
                                    # Personalized at download time
```

See [backend/README.md](backend/README.md) for the API surface in detail.

---

## History — the v0 Claude Code surface

This repo used to ship a parallel Claude Code plugin (local markdown + Python tools, no backend) alongside the claude.ai skill. It was retired once the hosted version reached feature parity and beyond (sectors, signup, logging — none of which the local plugin had).

The final state of that surface is preserved as a git tag:

```bash
git checkout v0-claude-code
```

`main` is now claude.ai-only.

---

## License

MIT.
