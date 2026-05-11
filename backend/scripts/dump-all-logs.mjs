#!/usr/bin/env node
// Owner-side bulk log export.
//
// Lists every user's log files from Vercel Blob and writes them locally to
// dist/logs/<userId>/<date>.jsonl. Run from the backend/ directory.
//
//   BLOB_READ_WRITE_TOKEN=$(grep BLOB_READ_WRITE_TOKEN .env.local | cut -d= -f2) \
//   node scripts/dump-all-logs.mjs
//
// Or `npx vercel env pull` first to populate .env.local, then run with no env
// (script reads from .env.local automatically).

import { list } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT_DIR = path.resolve(ROOT, "..", "dist", "logs");

async function loadEnvLocal() {
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.*?)["']?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    // no .env.local — env should already be set
  }
}

async function listAll() {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix: "users/", cursor, limit: 1000 });
    for (const b of page.blobs) out.push(b);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

async function main() {
  await loadEnvLocal();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "Missing BLOB_READ_WRITE_TOKEN. Run `npx vercel env pull` from backend/ first, or export it manually.",
    );
    process.exit(1);
  }

  console.log("Listing all blobs under users/ ...");
  const blobs = await listAll();
  const logs = blobs.filter((b) => b.pathname.includes("/logs/") && b.pathname.endsWith(".jsonl"));
  console.log(`Found ${logs.length} log file(s) across all users.`);

  const byUser = new Map();
  for (const b of logs) {
    const m = b.pathname.match(/^users\/([^/]+)\/logs\/([0-9-]+)\.jsonl$/);
    if (!m) continue;
    const [, userId, date] = m;
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId).push({ date, url: b.url, size: b.size });
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  let total = 0;
  for (const [userId, files] of byUser) {
    const userDir = path.join(OUT_DIR, userId);
    await fs.mkdir(userDir, { recursive: true });
    for (const f of files) {
      const res = await fetch(f.url, { cache: "no-store" });
      const text = await res.text();
      const dest = path.join(userDir, `${f.date}.jsonl`);
      await fs.writeFile(dest, text, "utf-8");
      const lines = text.split("\n").filter((l) => l.trim()).length;
      total += lines;
      console.log(`  ${userId.slice(0, 8)}…/${f.date}.jsonl  →  ${lines} entries (${f.size}B)`);
    }
  }

  console.log(
    `\nDone. ${total} log entries from ${byUser.size} user(s) written to ${path.relative(process.cwd(), OUT_DIR)}/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
