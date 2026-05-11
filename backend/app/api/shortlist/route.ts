import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId, unauthorized, badRequest } from "@/lib/auth";
import { readState, writeState } from "@/lib/storage";

export const runtime = "nodejs";

const AddSchema = z.object({
  ticker: z.string().min(1).max(32),
  source: z.string().min(1).max(64),
  note: z.string().max(500).optional().default(""),
});

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const state = await readState(userId);
  const status = req.nextUrl.searchParams.get("status");
  const rows = status ? state.shortlist.filter((r) => r.status === status) : state.shortlist;
  return NextResponse.json({ shortlist: rows });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const ticker = parsed.data.ticker.toUpperCase();
  const state = await readState(userId);
  if (state.shortlist.some((r) => r.ticker === ticker)) {
    return NextResponse.json({ ok: true, duplicate: true, shortlist: state.shortlist });
  }
  state.shortlist.push({
    ticker,
    source: parsed.data.source,
    status: "candidate",
    last_touched: new Date().toISOString().slice(0, 10),
    note: parsed.data.note,
  });
  await writeState(userId, state);
  return NextResponse.json({ ok: true, shortlist: state.shortlist });
}
