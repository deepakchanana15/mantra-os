import { NextRequest, NextResponse } from "next/server";
import { setOrgCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { organizationId } = await req.json();
  if (typeof organizationId !== "string") {
    return NextResponse.json({ error: { message: "organizationId is required" } }, { status: 400 });
  }
  setOrgCookie(organizationId);
  return NextResponse.json({ ok: true });
}
