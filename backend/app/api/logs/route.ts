import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId, unauthorized, badRequest } from "@/lib/auth";
import { appendLogEntries, listLogDates, readLogDay } from "@/lib/storage";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const MAX_USER_MSG_CHARS = 4000;
const MAX_RESPONSE_SUMMARY_CHARS = 800;
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

const EntrySchema = z
  .object({
    conversation_id: z.string().min(1).max(64),
    flow: z.string().min(1).max(64),
    sector: z.string().max(64).default(""),
    user_message: z.string().max(MAX_USER_MSG_CHARS),
    response_summary: z.string().max(MAX_RESPONSE_SUMMARY_CHARS).default(""),
    response_length: z.number().int().nonnegative().default(0),
    metadata: z.record(z.string(), z.unknown()).default({}),
    duration_ms: z.number().int().nonnegative().optional(),
    ts: z.string().optional(),
  })
  .strict();

const PostSchema = z.union([
  EntrySchema,
  z.object({ entries: z.array(EntrySchema).min(1).max(50) }),
]);

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const items = "entries" in parsed.data ? parsed.data.entries : [parsed.data];
  const now = new Date().toISOString();
  const entries = items.map((item) => ({
    id: randomUUID(),
    conversation_id: item.conversation_id,
    ts: item.ts ?? now,
    flow: item.flow,
    sector: item.sector,
    user_message: item.user_message,
    response_summary: item.response_summary,
    response_length: item.response_length,
    metadata: item.metadata,
    duration_ms: item.duration_ms,
  }));

  const result = await appendLogEntries(userId, entries);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const date = req.nextUrl.searchParams.get("date");
  if (date) {
    if (!DATE_RX.test(date)) return badRequest("date must be YYYY-MM-DD");
    const entries = await readLogDay(userId, date);
    return NextResponse.json({ date, count: entries.length, entries });
  }

  const dates = await listLogDates(userId);
  return NextResponse.json({ dates });
}
