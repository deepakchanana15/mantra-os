import { cookies } from "next/headers";

export const SESSION_COOKIE = "mantraos_session";
export const ORG_COOKIE = "mantraos_org";

/** 7 days, matching the JWT expiry AuthService.login() issues (apps/api/src/modules/auth/auth.service.ts). */
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_SECONDS });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
  cookies().delete(ORG_COOKIE);
}

export function getSessionToken(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value;
}

export function setOrgCookie(organizationId: string) {
  cookies().set(ORG_COOKIE, organizationId, { ...cookieOptions, maxAge: SESSION_MAX_AGE_SECONDS });
}

export function getOrgId(): string | undefined {
  return cookies().get(ORG_COOKIE)?.value;
}
