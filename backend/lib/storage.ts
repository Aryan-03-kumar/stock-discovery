import { put, head, list } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_UNIVERSAL_PHILOSOPHY, defaultState } from "./defaults";
import type { State, FinancialsCache, Philosophy, DecisionEntry, LogEntry } from "./types";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.join(process.cwd(), ".data");

async function readBlobAt(pathname: string): Promise<string | null> {
  if (USE_BLOB) {
    try {
      const meta = await head(pathname);
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }
  try {
    return await fs.readFile(path.join(LOCAL_DIR, pathname), "utf-8");
  } catch {
    return null;
  }
}

async function writeBlobAt(pathname: string, content: string): Promise<void> {
  if (USE_BLOB) {
    await put(pathname, content, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
    return;
  }
  const fp = path.join(LOCAL_DIR, pathname);
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, content, "utf-8");
}

function upgradePhilosophy(value: unknown): Philosophy {
  if (typeof value === "string") {
    return { universal: value || DEFAULT_UNIVERSAL_PHILOSOPHY, sectors: {} };
  }
  if (value && typeof value === "object") {
    const v = value as Partial<Philosophy>;
    return {
      universal: typeof v.universal === "string" ? v.universal : DEFAULT_UNIVERSAL_PHILOSOPHY,
      sectors:
        v.sectors && typeof v.sectors === "object" && !Array.isArray(v.sectors)
          ? (v.sectors as Record<string, string>)
          : {},
    };
  }
  return { universal: DEFAULT_UNIVERSAL_PHILOSOPHY, sectors: {} };
}

function upgradeDecisions(value: unknown): DecisionEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map((d) => ({
    ticker: String(d?.ticker ?? "UNKNOWN"),
    verdict: d?.verdict === "accept" ? "accept" : "reject",
    sector: typeof d?.sector === "string" && d.sector.length > 0 ? d.sector : "unspecified",
    date: typeof d?.date === "string" ? d.date : new Date().toISOString().slice(0, 10),
    reason: typeof d?.reason === "string" ? d.reason : "",
    anomalies: Array.isArray(d?.anomalies) ? d.anomalies : [],
    cross_questioning: typeof d?.cross_questioning === "string" ? d.cross_questioning : "",
    open_follow_ups: typeof d?.open_follow_ups === "string" ? d.open_follow_ups : "",
    status_before: d?.status_before ?? "unknown",
  }));
}

export async function readState(userId: string): Promise<State> {
  const raw = await readBlobAt(`users/${userId}/state.json`);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      shortlist: Array.isArray(parsed?.shortlist) ? parsed.shortlist : base.shortlist,
      decisions: upgradeDecisions(parsed?.decisions),
      philosophy: upgradePhilosophy(parsed?.philosophy),
      criteria: typeof parsed?.criteria === "string" ? parsed.criteria : base.criteria,
    };
  } catch {
    return defaultState();
  }
}

export async function writeState(userId: string, state: State): Promise<void> {
  await writeBlobAt(`users/${userId}/state.json`, JSON.stringify(state, null, 2));
}

export async function readCache(userId: string, ticker: string): Promise<FinancialsCache | null> {
  const raw = await readBlobAt(`users/${userId}/cache/${ticker}.json`);
  return raw ? (JSON.parse(raw) as FinancialsCache) : null;
}

export async function writeCache(userId: string, ticker: string, data: FinancialsCache): Promise<void> {
  await writeBlobAt(`users/${userId}/cache/${ticker}.json`, JSON.stringify(data));
}

export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isFresh(fetchedAt: string): boolean {
  const age = Date.now() - new Date(fetchedAt).getTime();
  return age < CACHE_TTL_MS;
}

// === Logs ===
// One JSONL file per user per UTC day: users/<userId>/logs/<YYYY-MM-DD>.jsonl.
// Append is read-modify-write — fine for our scale (a few events/day per user).

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function logPath(userId: string, date: string): string {
  return `users/${userId}/logs/${date}.jsonl`;
}

export async function appendLogEntries(
  userId: string,
  entries: LogEntry[],
): Promise<{ date: string; count: number }> {
  if (entries.length === 0) return { date: todayUTC(), count: 0 };
  const date = todayUTC();
  const pathname = logPath(userId, date);
  const existing = (await readBlobAt(pathname)) ?? "";
  const newLines = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  await writeBlobAt(pathname, existing + newLines);
  return { date, count: entries.length };
}

export async function readLogDay(userId: string, date: string): Promise<LogEntry[]> {
  const raw = await readBlobAt(logPath(userId, date));
  if (!raw) return [];
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const out: LogEntry[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as LogEntry);
    } catch {
      // skip malformed lines
    }
  }
  return out;
}

export async function listLogDates(userId: string): Promise<string[]> {
  const prefix = `users/${userId}/logs/`;
  if (USE_BLOB) {
    const out: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      for (const blob of page.blobs) {
        const name = blob.pathname.slice(prefix.length);
        if (name.endsWith(".jsonl")) out.push(name.slice(0, -".jsonl".length));
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out.sort().reverse();
  }
  try {
    const dir = path.join(LOCAL_DIR, prefix);
    const entries = await fs.readdir(dir);
    return entries
      .filter((n) => n.endsWith(".jsonl"))
      .map((n) => n.slice(0, -".jsonl".length))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function readLogsSince(userId: string, sinceDate: string): Promise<LogEntry[]> {
  const dates = (await listLogDates(userId)).filter((d) => d >= sinceDate).sort();
  const out: LogEntry[] = [];
  for (const date of dates) {
    out.push(...(await readLogDay(userId, date)));
  }
  return out;
}
