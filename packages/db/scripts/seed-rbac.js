/**
 * Seeds the Permission catalog and the five fixed system Roles
 * (Owner/Admin/Manager/Member/Viewer) with their RolePermission bundles.
 * See ARCHITECTURE.md "RBAC scope" for the matrix this encodes, and
 * DECISIONS.md "Deletion governance" for why delete permissions are
 * granted broadly here — the real restriction on deleting a specific
 * record is enforced by DeletionGuardService (self-delete check, per-user
 * grant, 1/day limit), not by role. The role-level "x:delete" key is only
 * a coarse gate keeping Viewer out of delete entirely.
 *
 * Idempotent — safe to re-run. Reads permission keys from the already
 * -compiled apps/api output so this can never drift from what the API
 * actually checks (see permission-keys.ts's own "single source of truth"
 * comment).
 *
 * Usage: node scripts/seed-rbac.js
 *
 * Reads DATABASE_URL from packages/db/.env explicitly rather than relying
 * on the generated Prisma client's own implicit .env discovery — see
 * create-demo-user.js's comment for why that auto-discovery can't be
 * trusted (it resolves relative to wherever `prisma generate` was last
 * run from, not reliably this package's own .env).
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
const { PERMISSIONS } = require(
  path.join(__dirname, "..", "..", "..", "apps", "api", "dist", "src", "common", "permissions", "permission-keys.js"),
);
// rolesFor() moved to apps/api/src/common/permissions/roles-for.ts during
// Phase 6 so it's unit-testable — imported from the compiled output the
// same way PERMISSIONS is, so this can never drift from what's tested.
const { rolesFor } = require(
  path.join(__dirname, "..", "..", "..", "apps", "api", "dist", "src", "common", "permissions", "roles-for.js"),
);

const SYSTEM_ROLES = [
  { key: "owner", name: "Owner" },
  { key: "admin", name: "Admin" },
  { key: "manager", name: "Manager" },
  { key: "member", name: "Member" },
  { key: "viewer", name: "Viewer" },
];

async function main() {
  const databaseUrl = loadEnvFile(path.join(__dirname, "..", ".env")).DATABASE_URL;
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const permissionKeys = Object.values(PERMISSIONS);

  console.log(`Seeding ${permissionKeys.length} permissions...`);
  for (const key of permissionKeys) {
    const [resource, action] = key.split(":");
    await prisma.permission.upsert({
      where: { key },
      create: { key, resource, action },
      update: { resource, action },
    });
  }

  console.log(`Seeding ${SYSTEM_ROLES.length} system roles...`);
  const roleIdByKey = {};
  for (const role of SYSTEM_ROLES) {
    // Prisma rejects `null` inside a compound-unique `where` (organizationId_key),
    // so this can't be a single upsert() — findFirst + manual create/update instead.
    const existing = await prisma.role.findFirst({
      where: { organizationId: null, key: role.key },
    });
    const record = existing
      ? await prisma.role.update({ where: { id: existing.id }, data: { name: role.name } })
      : await prisma.role.create({
          data: { organizationId: null, key: role.key, name: role.name, isSystem: true },
        });
    roleIdByKey[role.key] = record.id;
  }

  console.log("Wiring role -> permission bundles...");
  let bundleCount = 0;
  for (const key of permissionKeys) {
    const [resource, action] = key.split(":");
    const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
    const roles = rolesFor(resource, action);
    for (const roleKey of roles) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleIdByKey[roleKey], permissionId: permission.id } },
        create: { roleId: roleIdByKey[roleKey], permissionId: permission.id },
        update: {},
      });
      bundleCount++;
    }
  }

  console.log(`Done. ${permissionKeys.length} permissions, ${SYSTEM_ROLES.length} roles, ${bundleCount} role-permission links.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
