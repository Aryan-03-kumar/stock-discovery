import { NextRequest, NextResponse } from "next/server";
import { getUserId, unauthorized, badRequest } from "@/lib/auth";
import { readLogsSince } from "@/lib/storage";

export const runtime = "nodejs";

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const since = req.nextUrl.searchParams.get("since") ?? "1970-01-01";
  if (!DATE_RX.test(since)) return badRequest("since must be YYYY-MM-DD");

  const entries = await readLogsSince(userId, since);
  const body = entries.length > 0 ? entries.map((e) => JSON.stringify(e)).join("\n") + "\n" : "";
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": `attachment; filename="logs-${since}.jsonl"`,
      "Cache-Control": "no-store",
    },
  });
}
