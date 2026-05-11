import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId, unauthorized, badRequest } from "@/lib/auth";
import { readState, writeState } from "@/lib/storage";
import { defaultSectorPhilosophy } from "@/lib/defaults";

export const runtime = "nodejs";

const SECTOR_RX = /^[a-z][a-z0-9-]{0,40}$/;

const PutSchema = z
  .object({
    universal: z.string().max(50000).optional(),
    sectors: z.record(z.string().regex(SECTOR_RX), z.string().max(50000)).optional(),
  })
  .refine((v) => v.universal !== undefined || v.sectors !== undefined, {
    message: "Provide at least one of: universal, sectors",
  });

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const state = await readState(userId);
  const sector = req.nextUrl.searchParams.get("sector");

  if (sector) {
    if (!SECTOR_RX.test(sector)) return badRequest("Invalid sector slug");
    return NextResponse.json({
      sector,
      universal: state.philosophy.universal,
      sector_philosophy: state.philosophy.sectors[sector] ?? defaultSectorPhilosophy(sector),
      known_sectors: Object.keys(state.philosophy.sectors),
    });
  }

  return NextResponse.json({ philosophy: state.philosophy });
}

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const state = await readState(userId);
  if (parsed.data.universal !== undefined) {
    state.philosophy.universal = parsed.data.universal;
  }
  if (parsed.data.sectors) {
    for (const [slug, content] of Object.entries(parsed.data.sectors)) {
      if (content === "" || content === null) {
        delete state.philosophy.sectors[slug];
      } else {
        state.philosophy.sectors[slug] = content;
      }
    }
  }
  await writeState(userId, state);
  return NextResponse.json({ ok: true, known_sectors: Object.keys(state.philosophy.sectors) });
}
