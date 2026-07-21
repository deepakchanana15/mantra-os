/**
 * One-off: applies just the Sub-phase C RLS policy statements (opportunities,
 * invoices, support_tickets) against whatever DATABASE_URL is currently in
 * packages/db/.env — as the owner connection. Deliberately narrower than
 * setup-app-role.js (which also rotates the mantraos_app password and
 * rewrites apps/api/.env); rerunning that against prod would require also
 * updating Vercel's env vars immediately or the API loses its DB connection.
 * Default privileges granted during Sub-phase A already cover CRUD access
 * to new tables the owner creates, so only RLS is needed here.
 *
 * Usage: node scripts/apply-subphase-c-rls.js
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile(filePath) {
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z_]+)="(.*)"$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

const STATEMENTS = [
  `ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "opportunities" FORCE ROW LEVEL SECURITY`,
  `CREATE POLICY tenant_isolation ON "opportunities"
    USING ("organizationId" = current_setting('app.current_org_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_org_id', true))`,
  `ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY`,
  `CREATE POLICY tenant_isolation ON "invoices"
    USING ("organizationId" = current_setting('app.current_org_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_org_id', true))`,
  `ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "support_tickets" FORCE ROW LEVEL SECURITY`,
  `CREATE POLICY tenant_isolation ON "support_tickets"
    USING ("organizationId" = current_setting('app.current_org_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_org_id', true))`,
];

async function main() {
  const databaseUrl = loadEnvFile(path.join(__dirname, "..", ".env")).DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not found — is packages/db/.env populated?");
  }
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  let applied = 0;
  let skipped = 0;
  for (const statement of STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(statement);
      applied++;
    } catch (err) {
      if (/already exists/i.test(err.message)) {
        skipped++;
      } else {
        console.error(`Statement failed: ${statement.slice(0, 80)}...`);
        throw err;
      }
    }
  }
  console.log(`RLS: ${applied} statements applied, ${skipped} already in place.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
