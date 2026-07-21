/**
 * One-off verification, not part of the app: proves RLS actually isolates
 * data by querying as the restricted mantraos_app role (from apps/api/.env),
 * not the schema owner. Creates two orgs + one customer, checks that the
 * app role sees the customer only when app.current_org_id matches, and
 * cleans up afterward regardless of outcome.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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
  const ownerUrl = loadEnvFile(path.join(__dirname, "..", ".env")).DATABASE_URL;
  const appUrl = loadEnvFile(path.join(__dirname, "..", "..", "..", "apps", "api", ".env")).DATABASE_URL;

  const owner = new PrismaClient({ datasources: { db: { url: ownerUrl } } });
  const orgA = crypto.randomUUID();
  const orgB = crypto.randomUUID();
  const fakeUser = crypto.randomUUID();
  const customerId = crypto.randomUUID();

  try {
    await owner.$executeRawUnsafe(
      `INSERT INTO organizations (id, name, slug, "createdAt", "updatedAt") VALUES ('${orgA}', 'RLS Test Org A', 'rls-test-a-${orgA.slice(0, 8)}', now(), now())`,
    );
    await owner.$executeRawUnsafe(
      `INSERT INTO organizations (id, name, slug, "createdAt", "updatedAt") VALUES ('${orgB}', 'RLS Test Org B', 'rls-test-b-${orgB.slice(0, 8)}', now(), now())`,
    );
    await owner.$executeRawUnsafe(`
      INSERT INTO customers (id, "organizationId", name, type, "createdAt", "updatedAt", "createdBy", "updatedBy")
      VALUES ('${customerId}', '${orgA}', 'RLS Test Customer', 'STORE', now(), now(), '${fakeUser}', '${fakeUser}')
    `);

    const app = new PrismaClient({ datasources: { db: { url: appUrl } } });

    const withoutContext = await app.$queryRawUnsafe(`SELECT id FROM customers WHERE id = '${customerId}'`);
    const withWrongOrg = await app.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${orgB}'`);
      return tx.$queryRawUnsafe(`SELECT id FROM customers WHERE id = '${customerId}'`);
    });
    const withRightOrg = await app.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${orgA}'`);
      return tx.$queryRawUnsafe(`SELECT id FROM customers WHERE id = '${customerId}'`);
    });

    console.log("No tenant context set  -> rows visible:", withoutContext.length, "(expect 0)");
    console.log("Wrong org set (Org B)   -> rows visible:", withWrongOrg.length, "(expect 0)");
    console.log("Correct org set (Org A) -> rows visible:", withRightOrg.length, "(expect 1)");

    const pass = withoutContext.length === 0 && withWrongOrg.length === 0 && withRightOrg.length === 1;
    console.log(pass ? "\n✅ RLS is enforcing tenant isolation correctly." : "\n❌ RLS is NOT behaving as expected.");

    await app.$disconnect();
  } finally {
    await owner.$executeRawUnsafe(`DELETE FROM customers WHERE id = '${customerId}'`);
    await owner.$executeRawUnsafe(`DELETE FROM organizations WHERE id IN ('${orgA}', '${orgB}')`);
    await owner.$disconnect();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err.message);
  process.exit(1);
});
