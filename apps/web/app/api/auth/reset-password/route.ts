import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${API_BASE_URL}/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
