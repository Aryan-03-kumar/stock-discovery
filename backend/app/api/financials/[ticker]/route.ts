import { NextRequest, NextResponse } from "next/server";
import { getUserId, unauthorized } from "@/lib/auth";
import { readCache, writeCache, isFresh } from "@/lib/storage";
import { fetchScreener } from "@/lib/screener";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();
  const { ticker: tickerRaw } = await params;
  const ticker = tickerRaw.toUpperCase();
  const force = req.nextUrl.searchParams.get("refresh") === "1";

  if (!force) {
    const cached = await readCache(userId, ticker);
    if (cached && isFresh(cached.fetched_at)) {
      return NextResponse.json({ ...cached, from_cache: true });
    }
  }

  try {
    const data = await fetchScreener(ticker);
    await writeCache(userId, ticker, data);
    return NextResponse.json({ ...data, from_cache: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "fetch_failed", ticker, message },
      { status: 502 },
    );
  }
}
