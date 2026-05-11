# backend/

Next.js 16 service that backs the [stock-research](../claude-ai-skill/stock-research/) claude.ai skill. Holds per-user state in Vercel Blob and proxies Screener.in scrapes with a 7-day cache.

**Live:** https://stock-discovery.vercel.app

## What's in here

```
backend/
├── app/
│   ├── api/
│   │   ├── signup/             # POST — mints a fresh user token
│   │   ├── download-bundle/    # GET — returns personalized skill zip
│   │   ├── state/              # GET — all per-user state in one read
│   │   ├── shortlist/          # CRUD on the working set of tickers
│   │   ├── decisions/          # POST a verdict, GET filtered by ticker/sector
│   │   ├── philosophy/         # GET (sector-aware), PUT (partial updates)
│   │   ├── criteria/           # GET/PUT the anomaly checklist
│   │   ├── financials/[ticker]/ # GET — Screener scrape, cached 7 days
│   │   └── logs/               # POST append, GET list/fetch by date
│   │       └── export/         # GET — NDJSON since a date
│   └── page.tsx                # 2-state landing page (signup → download)
├── lib/
│   ├── auth.ts                 # Bearer-token-as-namespace
│   ├── defaults.ts             # Default criteria + philosophy markdown
│   ├── screener.ts             # Cheerio-based scraper for screener.in
│   ├── storage.ts              # Vercel Blob client + local-fs fallback
│   └── types.ts                # Shared TS types
├── templates/                   # Synced from ../claude-ai-skill/ at build time
├── scripts/
│   ├── sync-skill-template.mjs # Prebuild: copies skill into templates/
│   └── dump-all-logs.mjs       # Owner-side log export via Blob API
└── next.config.ts              # outputFileTracingIncludes for templates/
```

## API surface

All endpoints require `Authorization: Bearer <user-token>` unless noted.

| Method | Path | Auth | What it does |
|---|---|---|---|
| `POST` | `/api/signup` | none | Mint a fresh 32-char UUID token. Returns `{ token, bundle_url, instructions }`. |
| `GET` | `/api/download-bundle?token=<t>` | token-in-URL | Build a zip of the skill with `<t>` baked into `scripts/api.py`. |
| `GET` | `/api/state` | yes | Full state: shortlist, decisions, philosophy, criteria. |
| `GET` | `/api/shortlist?status=<s>` | yes | List shortlist rows, optionally filtered by status. |
| `POST` | `/api/shortlist` | yes | Append a ticker (idempotent on duplicates). |
| `PATCH` | `/api/shortlist/<ticker>` | yes | Update status / note on one row. |
| `DELETE` | `/api/shortlist/<ticker>` | yes | Remove a row. |
| `GET` | `/api/decisions?ticker=<t>&sector=<s>` | yes | List decisions, filterable. |
| `POST` | `/api/decisions` | yes | Save an accept/reject. Requires `sector` slug. |
| `GET` | `/api/philosophy` | yes | Full philosophy object `{ universal, sectors }`. |
| `GET` | `/api/philosophy?sector=<s>` | yes | Returns `{ universal, sector_philosophy, known_sectors }` — what the skill loads as context. |
| `PUT` | `/api/philosophy` | yes | Partial update: `{ universal?, sectors? }`. Empty-string deletes a sector. |
| `GET` | `/api/criteria` | yes | Anomaly checklist markdown. |
| `PUT` | `/api/criteria` | yes | Replace the checklist. |
| `GET` | `/api/financials/<ticker>` | yes | Screener-scraped 10-12yr P&L/BS/CF/Ratios. 7-day cache. Add `?refresh=1` to bust. |
| `POST` | `/api/logs` | yes | Append one entry or a batch of up to 50. |
| `GET` | `/api/logs` | yes | List available dates. |
| `GET` | `/api/logs?date=YYYY-MM-DD` | yes | Fetch one day's entries. |
| `GET` | `/api/logs/export?since=YYYY-MM-DD` | yes | NDJSON dump for offline analysis. |

## Storage layout

Per user, keyed under their token in Vercel Blob:

```
users/<token>/state.json                  # shortlist, decisions, philosophy, criteria
users/<token>/cache/<TICKER>.json         # Screener data, 7-day TTL
users/<token>/logs/<YYYY-MM-DD>.jsonl     # one entry per skill invocation
```

When no `BLOB_READ_WRITE_TOKEN` is set (e.g. local dev without `vercel env pull`), storage falls back to local files under `.data/`.

## Local development

```bash
npm install
npx vercel env pull               # pulls BLOB_READ_WRITE_TOKEN into .env.local
                                  # WARNING: dev server then writes to PROD Blob
npm run dev                       # http://localhost:3000

# Or, pure local-fs mode (no Blob):
rm .env.local
npm run dev                       # writes to backend/.data/, prod Blob untouched
```

`npm run dev` and `npm run build` both invoke `sync-skill-template` first — that copies `../claude-ai-skill/stock-research/` into `templates/stock-research/` so the `download-bundle` route can serve the latest skill files.

## Owner-side log export

```bash
npx vercel env pull               # gets BLOB_READ_WRITE_TOKEN
npm run dump-logs                 # writes dist/logs/<userId>/<date>.jsonl
```

Lists every user's log files via `@vercel/blob`'s `list({ prefix: 'users/' })`, downloads each, writes to local disk. No public admin endpoint — access is gated by ownership of the Vercel project.

## Deploy

```bash
npx vercel deploy --prod --yes
```

The Blob store `stock-state-linked` is linked to the project, so `BLOB_READ_WRITE_TOKEN` is set automatically in all 3 environments (production, preview, development).
