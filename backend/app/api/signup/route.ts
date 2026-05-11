import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST() {
  const token = randomUUID().replace(/-/g, "");
  return NextResponse.json({
    token,
    bundle_url: `/api/download-bundle?token=${token}`,
    instructions: [
      "Copy this token somewhere safe — it's your only access. If you lose it, you lose your saved state.",
      "Download the personalized skill zip from bundle_url.",
      "In claude.ai → Settings → Capabilities → Skills, click Upload skill and drop the zip (or the unzipped folder).",
      "Make sure Code Execution is enabled in your claude.ai capabilities.",
      "Start a new chat and describe a sector + thesis. The skill will trigger automatically.",
    ],
  });
}
