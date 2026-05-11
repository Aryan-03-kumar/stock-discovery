import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

export const runtime = "nodejs";

const TOKEN_RX = /^[a-f0-9]{32}$/;
const TEMPLATE_DIR = path.join(process.cwd(), "templates", "stock-research");

async function walk(dir: string, base = ""): Promise<{ rel: string; abs: string }[]> {
  const out: { rel: string; abs: string }[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(dir, ent.name);
    const rel = base ? path.posix.join(base, ent.name) : ent.name;
    if (ent.isDirectory()) {
      out.push(...(await walk(abs, rel)));
    } else if (ent.isFile()) {
      out.push({ rel, abs });
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!TOKEN_RX.test(token)) {
    return NextResponse.json(
      { error: "invalid_token", hint: "Get one from POST /api/signup" },
      { status: 400 },
    );
  }

  let files: { rel: string; abs: string }[];
  try {
    files = await walk(TEMPLATE_DIR);
  } catch {
    return NextResponse.json(
      { error: "template_missing", hint: "Run `npm run sync-skill-template` before building." },
      { status: 500 },
    );
  }

  const zip = new JSZip();
  const root = zip.folder("stock-research");
  if (!root) throw new Error("zip folder failed");

  for (const f of files) {
    let content = await fs.readFile(f.abs, "utf-8");
    if (f.rel.endsWith("api.py")) {
      content = content.replace("__USER_TOKEN_HERE__", token);
    }
    root.file(f.rel, content);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="stock-research-${token.slice(0, 8)}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
