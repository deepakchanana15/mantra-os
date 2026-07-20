import { getOrgId, getSessionToken } from "./session";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(typeof body === "object" && body && "error" in body ? String((body as { error: { message?: string } }).error?.message) : "API error");
  }
}

/**
 * Server-side only — reads the httpOnly session/org cookies directly
 * (never exposed to client JS) and calls the NestJS API. Used by Server
 * Components for reads and by app/api/[...path]/route.ts for the proxy
 * client components call for mutations/interactive lists.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { skipOrgHeader?: boolean } = {},
): Promise<T> {
  const token = getSessionToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!init.skipOrgHeader) {
    const orgId = getOrgId();
    if (orgId) headers.set("X-Organization-Id", orgId);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type");
  const body = contentType?.includes("application/json") ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}
