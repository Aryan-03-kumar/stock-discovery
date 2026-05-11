import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId, unauthorized, badRequest } from "@/lib/auth";
import { readState, writeState } from "@/lib/storage";

export const runtime = "nodejs";

const SECTOR_RX = /^[a-z][a-z0-9-]{0,40}$/;

const SaveSchema = z.object({
  ticker: z.string().min(1).max(32),
  verdict: z.enum(["accept", "reject"]),
  sector: z.string().regex(SECTOR_RX),
  reason: z.string().min(20),
  anomalies: z.array(z.string()).default([]),
  cross_questioning: z.string().default(""),
  open_follow_ups: z.string().default(""),
});

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const state = await readState(userId);
  const ticker = req.nextUrl.searchParams.get("ticker");
  const sector = req.nextUrl.searchParams.get("sector");

  let list = state.decisions;
  if (ticker) list = list.filter((d) => d.ticker === ticker.toUpperCase());
  if (sector) list = list.filter((d) => d.sector === sector);

  return NextResponse.json({ decisions: list });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const ticker = parsed.data.ticker.toUpperCase();
  const state = await readState(userId);
  const row = state.shortlist.find((r) => r.ticker === ticker);
  const statusBefore = row?.status ?? "unknown";

  state.decisions.push({
    ticker,
    verdict: parsed.data.verdict,
    sector: parsed.data.sector,
    date: new Date().toISOString().slice(0, 10),
    reason: parsed.data.reason,
    anomalies: parsed.data.anomalies,
    cross_questioning: parsed.data.cross_questioning,
    open_follow_ups: parsed.data.open_follow_ups,
    status_before: statusBefore,
  });

  if (row) {
    row.status = parsed.data.verdict === "accept" ? "accepted" : "rejected";
    row.last_touched = new Date().toISOString().slice(0, 10);
    if (!row.note) row.note = parsed.data.reason.slice(0, 80);
  }

  await writeState(userId, state);
  return NextResponse.json({
    ok: true,
    decisions_count: state.decisions.length,
    sector: parsed.data.sector,
  });
}
