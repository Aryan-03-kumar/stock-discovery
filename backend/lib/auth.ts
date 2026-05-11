import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const TOKEN_RX = /^[a-zA-Z0-9_-]{8,64}$/;

export function getUserId(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return TOKEN_RX.test(token) ? token : null;
}

export function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized", hint: "Send Authorization: Bearer <user-token>" },
    { status: 401 },
  );
}

export function badRequest(message: string) {
  return NextResponse.json({ error: "bad_request", message }, { status: 400 });
}
