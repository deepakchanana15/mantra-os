import { NextRequest, NextResponse } from "next/server";
import { getOrgId, getSessionToken } from "@/lib/session";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

/**
 * The only path client components use to reach the NestJS API. The
 * session JWT is httpOnly (never readable by client JS — see
 * DECISIONS.md "Self-hosted authentication replaces Firebase" on why
 * there's no Auth.js-style client session helper), so this route reads it
 * server-side and attaches it as a real Authorization header, along with
 * X-Organization-Id from the org-selection cookie. Server Components can
 * skip this and call lib/api.ts's apiFetch() directly.
 */
async function proxy(req: NextRequest, path: string[]) {
  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const orgId = getOrgId();
  if (orgId) headers.set("X-Organization-Id", orgId);
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const search = req.nextUrl.search;
  const body = ["GET", "HEAD"].includes(req.method) ? undefined : await req.text();

  const res = await fetch(`${API_BASE_URL}/v1/${path.join("/")}${search}`, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const resContentType = res.headers.get("content-type");
  if (resContentType?.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  // Binary/non-JSON responses (e.g. the invoice PDF) — .text() would
  // corrupt binary bytes, and the content type/filename must be forwarded
  // for the browser to render/download it correctly.
  const passthroughHeaders = new Headers();
  if (resContentType) passthroughHeaders.set("content-type", resContentType);
  const disposition = res.headers.get("content-disposition");
  if (disposition) passthroughHeaders.set("content-disposition", disposition);
  return new NextResponse(await res.arrayBuffer(), { status: res.status, headers: passthroughHeaders });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
