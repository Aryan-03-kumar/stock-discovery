#!/usr/bin/env node
// Copy ../claude-ai-skill/stock-research/ into templates/stock-research/.
// Runs as a prebuild step so the download-bundle route always has the latest skill files.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, "..", "..", "claude-ai-skill", "stock-research");
const DEST = path.resolve(HERE, "..", "templates", "stock-research");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const ent of entries) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      await copyDir(s, d);
    } else if (ent.isFile()) {
      await fs.copyFile(s, d);
    }
  }
}

if (!(await exists(SRC))) {
  console.warn(`[sync-skill-template] source not found at ${SRC} — skipping`);
  process.exit(0);
}

await fs.rm(DEST, { recursive: true, force: true });
await copyDir(SRC, DEST);
console.log(`[sync-skill-template] copied ${SRC} → ${DEST}`);
