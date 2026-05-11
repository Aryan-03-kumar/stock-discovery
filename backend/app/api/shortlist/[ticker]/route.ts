import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId, unauthorized, badRequest } from "@/lib/auth";
import { readState, writeState } from "@/lib/storage";

export const runtime = "nodejs";

const PatchSchema = z.object({
  status: z.enum(["candidate", "scanned", "accepted", "rejected"]).optional(),
  note: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const { ticker: tickerRaw } = await params;
  const ticker = tickerRaw.toUpperCase();
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const state = await readState(userId);
  const row = state.shortlist.find((r) => r.ticker === ticker);
  if (!row) {
    return NextResponse.json({ error: "not_found", ticker }, { status: 404 });
  }
  if (parsed.data.status) row.status = parsed.data.status;
  if (parsed.data.note !== undefined) row.note = parsed.data.note;
  row.last_touched = new Date().toISOString().slice(0, 10);
  await writeState(userId, state);
  return NextResponse.json({ ok: true, ticker, row });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const { ticker: tickerRaw } = await params;
  const ticker = tickerRaw.toUpperCase();
  const state = await readState(userId);
  const before = state.shortlist.length;
  state.shortlist = state.shortlist.filter((r) => r.ticker !== ticker);
  if (state.shortlist.length === before) {
    return NextResponse.json({ error: "not_found", ticker }, { status: 404 });
  }
  await writeState(userId, state);
  return NextResponse.json({ ok: true, ticker });
}
