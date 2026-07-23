/**
 * One-off: applies RLS policy statements for `marketing_integrations` and
 * `ad_campaign_metrics` against whatever DATABASE_URL is currently in
 * packages/db/.env — as the owner connection. Same narrow pattern as
 * apply-invoice-lines-rls.js.
 *
 * Usage: node scripts/apply-ad-metrics-rls.js
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
  `ALTER TABLE "marketing_integrations" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "marketing_integrations" FORCE ROW LEVEL SECURITY`,
  `CREATE POLICY tenant_isolation ON "marketing_integrations"
    USING ("organizationId" = current_setting('app.current_org_id', true))
    WITH CHECK ("organizationId" = current_setting('app.current_org_id', true))`,
  `ALTER TABLE "ad_campaign_metrics" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "ad_campaign_metrics" FORCE ROW LEVEL SECURITY`,
  `CREATE POLICY tenant_isolation ON "ad_campaign_metrics"
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
