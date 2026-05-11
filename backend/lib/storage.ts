import { put, head } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_UNIVERSAL_PHILOSOPHY, defaultState } from "./defaults";
import type { State, FinancialsCache, Philosophy, DecisionEntry } from "./types";

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
