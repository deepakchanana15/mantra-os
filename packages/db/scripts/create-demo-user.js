/**
 * One-off, not part of the app: creates a persistent (non-cleanup) demo
 * Organization + Owner user so a human can log into the running app and
 * click around. Unlike the verify-*.js scripts, this data is NOT deleted
 * afterward — it's meant to stick around for manual exploration.
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
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
  console.log(`  URL:      http://localhost:3000/login`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Org:      ${org.name}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed to create demo user:", err);
  process.exit(1);
});
