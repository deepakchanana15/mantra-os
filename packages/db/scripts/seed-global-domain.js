/**
 * Seeds Sub-phase A's master data: the global Currency reference list, plus
 * one Company + Country per of Mantra Sports' current operating countries
 * for the demo organization (mantra-sports-demo). Currencies are global
 * (idempotent upsert by code); Company/Country are org-scoped, created only
 * if they don't already exist for that org. Re-runnable.
 *
 * Reads DATABASE_URL from packages/db/.env explicitly — see
 * create-demo-user.js's comment for why.
 *
 * Usage: node scripts/seed-global-domain.js
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

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
];

// One legal entity + operating country per current market. India (next
// planned country) is deliberately not seeded here — added when that
// expansion actually happens, not speculatively now.
const COUNTRIES = [
  { company: "Mantra Sports USA LLC", country: "United States", isoCode: "US", currency: "USD", timeZone: "America/New_York" },
  { company: "Mantra Sports Canada Inc.", country: "Canada", isoCode: "CA", currency: "CAD", timeZone: "America/Toronto" },
  { company: "Mantra Sports Australia Pty Ltd", country: "Australia", isoCode: "AU", currency: "AUD", timeZone: "Australia/Sydney" },
  { company: "Mantra Sports New Zealand Ltd", country: "New Zealand", isoCode: "NZ", currency: "NZD", timeZone: "Pacific/Auckland" },
  { company: "Mantra Sports Netherlands B.V.", country: "Netherlands", isoCode: "NL", currency: "EUR", timeZone: "Europe/Amsterdam" },
  { company: "Mantra Sports Germany GmbH", country: "Germany", isoCode: "DE", currency: "EUR", timeZone: "Europe/Berlin" },
];

async function main() {
  const databaseUrl = loadEnvFile(path.join(__dirname, "..", ".env")).DATABASE_URL;
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  console.log(`Seeding ${CURRENCIES.length} currencies...`);
  const currencyByCode = {};
  for (const c of CURRENCIES) {
    const row = await prisma.currency.upsert({
      where: { code: c.code },
      update: { name: c.name, symbol: c.symbol },
      create: { code: c.code, name: c.name, symbol: c.symbol },
    });
    currencyByCode[c.code] = row;
  }

  const org = await prisma.organization.findFirst({ where: { slug: "mantra-sports-demo" } });
  if (!org) {
    console.log("No 'mantra-sports-demo' organization found — skipping Company/Country seeding (currencies still seeded).");
    await prisma.$disconnect();
    return;
  }

  const ownerMembership = await prisma.membership.findFirst({
    where: { organizationId: org.id, role: { key: "owner" } },
  });
  if (!ownerMembership) {
    throw new Error(`No Owner membership found for org ${org.id} — needed for createdBy/updatedBy`);
  }
  const systemUserId = ownerMembership.userId;

  console.log(`Seeding ${COUNTRIES.length} companies/countries for org "${org.name}"...`);
  for (const entry of COUNTRIES) {
    let company = await prisma.company.findFirst({ where: { organizationId: org.id, name: entry.company } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          organizationId: org.id,
          name: entry.company,
          baseCurrencyId: currencyByCode[entry.currency].id,
          createdBy: systemUserId,
          updatedBy: systemUserId,
        },
      });
      console.log(`  Created company: ${entry.company}`);
    }

    const existingCountry = await prisma.country.findFirst({ where: { companyId: company.id, isoCode: entry.isoCode } });
    if (!existingCountry) {
      await prisma.country.create({
        data: {
          organizationId: org.id,
          companyId: company.id,
          name: entry.country,
          isoCode: entry.isoCode,
          currencyId: currencyByCode[entry.currency].id,
          timeZone: entry.timeZone,
          createdBy: systemUserId,
          updatedBy: systemUserId,
        },
      });
      console.log(`  Created country: ${entry.country} (${entry.isoCode})`);
    }
  }

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
