import { NextRequest, NextResponse } from "next/server";
import { ORG_COOKIE, SESSION_COOKIE } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has(SESSION_COOKIE);
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/orgs", req.url));
  }

  const hasOrg = req.cookies.has(ORG_COOKIE);
  if (hasSession && !hasOrg && pathname !== "/orgs" && !isPublicPath) {
    return NextResponse.redirect(new URL("/orgs", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
