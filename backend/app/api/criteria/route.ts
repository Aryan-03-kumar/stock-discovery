import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId, unauthorized, badRequest } from "@/lib/auth";
import { readState, writeState } from "@/lib/storage";

export const runtime = "nodejs";

const PutSchema = z.object({
  criteria: z.string().min(1).max(50000),
});

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const state = await readState(userId);
  return NextResponse.json({ criteria: state.criteria });
}

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const state = await readState(userId);
  state.criteria = parsed.data.criteria;
  await writeState(userId, state);
  return NextResponse.json({ ok: true });
}
