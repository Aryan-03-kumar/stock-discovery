import { put, head } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";
import { defaultState } from "./defaults";
import type { State, FinancialsCache } from "./types";

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

export async function readState(userId: string): Promise<State> {
  const raw = await readBlobAt(`users/${userId}/state.json`);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
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
