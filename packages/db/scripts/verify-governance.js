/**
 * Full-stack verification of the governance rules that verify-frontend-e2e.js
 * doesn't cover: the daily deletion rate limit, Viewer role write denial, and
 * cross-org data isolation via RLS. Drives the real running Next.js app
 * (proxying to the real running NestJS API) over HTTP with real cookies,
 * same as verify-frontend-e2e.js. Requires both servers running. Cleans up
 * all test data afterward regardless of outcome.
 */
require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";

function cookieHeader(setCookieValues, existing = {}) {
  const jar = { ...existing };
  for (const raw of setCookieValues) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    jar[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return jar;
}

function toHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

let checks = 0;
let passed = 0;
function check(label, condition) {
  checks++;
  if (condition) {
    passed++;
    console.log(`✅ ${label}`);
  } else {
    console.log(`❌ ${label}`);
  }
}

async function loginAndSelectOrg(email, password, organizationId) {
  let res = await fetch(`${WEB_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  let cookies = cookieHeader(res.headers.getSetCookie());
  if (!res.ok) throw new Error(`Login failed for ${email}`);

  res = await fetch(`${WEB_BASE_URL}/api/org/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: toHeader(cookies) },
    body: JSON.stringify({ organizationId }),
  });
  cookies = cookieHeader(res.headers.getSetCookie(), cookies);
  if (!res.ok) throw new Error(`Org selection failed for ${email}`);
  return cookies;
}

function fetchJsonWith(cookies) {
  return async (path, init) => {
    const r = await fetch(`${WEB_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Cookie: toHeader(cookies), ...(init?.headers ?? {}) },
    });
    const text = await r.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { ok: r.ok, status: r.status, body };
  };
}

async function main() {
  const prisma = new PrismaClient();
  const password = "correct-horse-battery-staple";
  const passwordHash = await bcrypt.hash(password, 10);

  const ownerRole = await prisma.role.findFirst({ where: { organizationId: null, key: "owner" } });
  const viewerRole = await prisma.role.findFirst({ where: { organizationId: null, key: "viewer" } });
  if (!ownerRole || !viewerRole) throw new Error("Seeded 'owner'/'viewer' roles not found — run seed-rbac.js first");

  const orgA = await prisma.organization.create({ data: { name: "Governance Test Org A", slug: `gov-a-${Date.now()}` } });
  const orgB = await prisma.organization.create({ data: { name: "Governance Test Org B", slug: `gov-b-${Date.now()}` } });

  const ownerAEmail = `gov-owner-a-${crypto.randomBytes(4).toString("hex")}@example.com`;
  const viewerAEmail = `gov-viewer-a-${crypto.randomBytes(4).toString("hex")}@example.com`;
  const ownerBEmail = `gov-owner-b-${crypto.randomBytes(4).toString("hex")}@example.com`;

  const ownerA = await prisma.user.create({ data: { email: ownerAEmail, passwordHash, name: "Gov Owner A" } });
  const viewerA = await prisma.user.create({ data: { email: viewerAEmail, passwordHash, name: "Gov Viewer A" } });
  const ownerB = await prisma.user.create({ data: { email: ownerBEmail, passwordHash, name: "Gov Owner B" } });

  await prisma.membership.create({ data: { organizationId: orgA.id, userId: ownerA.id, roleId: ownerRole.id } });
  await prisma.membership.create({ data: { organizationId: orgA.id, userId: viewerA.id, roleId: viewerRole.id } });
  await prisma.membership.create({ data: { organizationId: orgB.id, userId: ownerB.id, roleId: ownerRole.id } });

  try {
    // --- 1. Daily deletion rate limit (DAILY_DELETE_LIMIT = 1) ---
    const ownerACookies = await loginAndSelectOrg(ownerAEmail, password, orgA.id);
    const asOwnerA = fetchJsonWith(ownerACookies);

    const custA1 = await asOwnerA("/api/v1/customers", {
      method: "POST",
      body: JSON.stringify({ name: "Gov Customer A1", type: "COMPANY" }),
    });
    const firstDelete = await asOwnerA(`/api/v1/customers/${custA1.body.id}`, { method: "DELETE" });
    check("First deletion of the day succeeds for the Owner", firstDelete.ok);

    const custA2 = await asOwnerA("/api/v1/customers", {
      method: "POST",
      body: JSON.stringify({ name: "Gov Customer A2", type: "COMPANY" }),
    });
    const secondDelete = await asOwnerA(`/api/v1/customers/${custA2.body.id}`, { method: "DELETE" });
    check(
      "Second deletion of the day is blocked by the 1/day rate limit, even for the Owner",
      secondDelete.status === 403 && /deletion limit/i.test(JSON.stringify(secondDelete.body)),
    );

    // --- 2. Viewer role: read allowed, write denied ---
    const viewerACookies = await loginAndSelectOrg(viewerAEmail, password, orgA.id);
    const asViewerA = fetchJsonWith(viewerACookies);

    const viewerRead = await asViewerA("/api/v1/customers");
    check("Viewer can read the customers list", viewerRead.ok);

    const viewerWrite = await asViewerA("/api/v1/customers", {
      method: "POST",
      body: JSON.stringify({ name: "Should Be Denied", type: "COMPANY" }),
    });
    check("Viewer is denied (403) from creating a customer", viewerWrite.status === 403);

    // --- 3. Cross-org isolation via RLS ---
    const custA3 = await asOwnerA("/api/v1/customers", {
      method: "POST",
      body: JSON.stringify({ name: "Gov Customer A3 (org A only)", type: "COMPANY" }),
    });
    check("Setup: customer created in org A", custA3.ok);

    const ownerBCookies = await loginAndSelectOrg(ownerBEmail, password, orgB.id);
    const asOwnerB = fetchJsonWith(ownerBCookies);

    const crossOrgRead = await asOwnerB(`/api/v1/customers/${custA3.body.id}`);
    check("Org B's Owner cannot read org A's customer by ID (404, RLS-filtered)", crossOrgRead.status === 404);

    const crossOrgList = await asOwnerB("/api/v1/customers");
    const leaked = Array.isArray(crossOrgList.body) && crossOrgList.body.some((c) => c.id === custA3.body.id);
    check("Org A's customer does not appear in org B's customers list", crossOrgList.ok && !leaked);

    console.log(`\n${passed}/${checks} checks passed`);
    if (passed !== checks) process.exitCode = 1;
  } finally {
    for (const org of [orgA, orgB]) {
      await prisma.customer.deleteMany({ where: { organizationId: org.id } });
      await prisma.notification.deleteMany({ where: { organizationId: org.id } });
      await prisma.auditLog.deleteMany({ where: { organizationId: org.id } });
      await prisma.membership.deleteMany({ where: { organizationId: org.id } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [ownerA.id, viewerA.id, ownerB.id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
