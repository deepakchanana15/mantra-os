import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/session";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  setSessionCookie(data.accessToken);
  return NextResponse.json({ ok: true });
}
