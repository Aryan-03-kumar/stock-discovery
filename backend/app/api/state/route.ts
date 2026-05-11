import { NextRequest, NextResponse } from "next/server";
import { getUserId, unauthorized } from "@/lib/auth";
import { readState } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const state = await readState(userId);
  return NextResponse.json(state);
}
