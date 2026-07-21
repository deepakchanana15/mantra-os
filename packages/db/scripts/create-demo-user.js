/**
 * One-off, not part of the app: creates a persistent (non-cleanup) demo
 * Organization + Owner user so a human can log into the running app and
 * click around. Unlike the verify-*.js scripts, this data is NOT deleted
 * afterward — it's meant to stick around for manual exploration.
 *
 * Reads DATABASE_URL from packages/db/.env explicitly (like verify-rls.js
 * does) rather than relying on the generated Prisma client's own implicit
 * .env auto-discovery — that auto-discovery resolves relative to wherever
 * `prisma generate` was last run from (e.g. apps/api during a build), not
 * reliably this package's own .env, and silently connecting as the wrong
 * role/database is exactly the kind of mistake this project's DB
 * principles (DATABASE.md) exist to prevent. Pass WEB_LOGIN_URL to print
 * a different login URL (e.g. the deployed prod URL instead of localhost).
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile(filePath) {
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)="(.*)"$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

async function main() {
  const databaseUrl = loadEnvFile(path.join(__dirname, "..", ".env")).DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not found — is packages/db/.env populated?");
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const loginUrl = process.env.WEB_LOGIN_URL || "http://localhost:3000/login";
  const email = "demo@mantrasports.test";
  const password = "MantraDemo!2026";
  const passwordHash = await bcrypt.hash(password, 10);

  const ownerRole = await prisma.role.findFirst({ where: { organizationId: null, key: "owner" } });
  if (!ownerRole) throw new Error("No seeded 'owner' role found — run seed-rbac.js first");

  let org = await prisma.organization.findFirst({ where: { slug: "mantra-sports-demo" } });
  if (!org) {
    org = await prisma.organization.create({ data: { name: "Mantra Sports (Demo)", slug: "mantra-sports-demo" } });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, passwordHash, name: "Demo Owner" } });
  }

  const existingMembership = await prisma.membership.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
  });
  if (!existingMembership) {
    await prisma.membership.create({ data: { organizationId: org.id, userId: user.id, roleId: ownerRole.id } });
  }

  console.log("Demo account ready:");
  console.log(`  URL:      ${loginUrl}`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Org:      ${org.name}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed to create demo user:", err);
  process.exit(1);
});
