/**
 * One-time (per environment) setup: creates the mantraos_app runtime role,
 * grants it the privileges it needs, applies rls-policies.sql, and writes
 * a ready-to-use DATABASE_URL for apps/api/.env — all via the owner
 * connection already sitting in packages/db/.env. Never prints the
 * generated password to stdout.
 *
 * Re-runnable: safe to run again against the same database (role password
 * is rotated on each run; grants and RLS statements are idempotent or
 * ignore "already exists" errors).
 *
 * Usage: node scripts/setup-app-role.js
 *
 * Reads DATABASE_URL from packages/db/.env explicitly rather than relying
 * on the generated Prisma client's own implicit .env discovery — see
 * create-demo-user.js's comment for why (it resolves relative to wherever
 * `prisma generate` was last run from, not reliably this package's own
 * .env, and this script needs the OWNER connection specifically to be
 * able to ALTER ROLE at all).
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

const APP_ROLE = "mantraos_app";

function buildAppUrl(ownerUrl, password) {
  const url = new URL(ownerUrl);
  url.username = APP_ROLE;
  url.password = password;
  // Neon's pooled-connection hostname convention: insert "-pooler" before
  // the first "." in the endpoint hostname. Verify against the Neon
  // dashboard's own pooled connection string if this doesn't connect —
  // this is the standard pattern, not read back from your project directly.
  const hostParts = url.hostname.split(".");
  if (!hostParts[0].endsWith("-pooler")) {
    hostParts[0] = `${hostParts[0]}-pooler`;
  }
  url.hostname = hostParts.join(".");
  return url.toString();
}

function splitSqlStatements(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const ownerUrl = loadEnvFile(path.join(__dirname, "..", ".env")).DATABASE_URL;
  if (!ownerUrl) {
    throw new Error("DATABASE_URL not found — is packages/db/.env populated?");
  }

  const password = crypto.randomBytes(24).toString("base64url");
  const prisma = new PrismaClient({ datasources: { db: { url: ownerUrl } } });

  console.log(`Creating/updating role "${APP_ROLE}"...`);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_ROLE}') THEN
        CREATE ROLE ${APP_ROLE} WITH LOGIN;
      END IF;
    END
    $$;
  `);
  await prisma.$executeRawUnsafe(`ALTER ROLE ${APP_ROLE} WITH LOGIN PASSWORD '${password}';`);

  console.log("Granting schema + table privileges...");
  await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${APP_ROLE};`);
  await prisma.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_ROLE};`);
  await prisma.$executeRawUnsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_ROLE};`);
  await prisma.$executeRawUnsafe(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_ROLE};`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_ROLE};`,
  );

  console.log("Applying rls-policies.sql...");
  const rlsSqlPath = path.join(__dirname, "..", "prisma", "rls-policies.sql");
  const statements = splitSqlStatements(fs.readFileSync(rlsSqlPath, "utf8"));
  let applied = 0;
  let skipped = 0;
  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      applied++;
    } catch (err) {
      // "already exists" is expected on re-runs (e.g. CREATE POLICY has no IF NOT EXISTS)
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

  const appUrl = buildAppUrl(ownerUrl, password);
  const apiEnvPath = path.join(__dirname, "..", "..", "..", "apps", "api", ".env");
  fs.writeFileSync(apiEnvPath, `DATABASE_URL="${appUrl}"\n`);
  console.log(`Wrote apps/api/.env with a fresh ${APP_ROLE} connection string.`);
  console.log("Done. No secrets were printed to this console.");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
