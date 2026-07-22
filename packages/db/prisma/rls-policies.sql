-- MantraOS Row-Level Security policies
-- Run after `prisma migrate deploy` — Prisma does not manage RLS in schema.prisma,
-- so this is a separate, versioned SQL file applied as part of the deploy pipeline.
-- See DATABASE.md "Row-Level Security" for the full rationale.
--
-- Design:
--   1. Two Postgres roles: a migrator (schema owner, bypasses RLS, runs Prisma
--      migrations) and an app_runtime role (used by the NestJS app in production,
--      NOT the owner, so RLS applies to it in full).
--   2. Every tenant-scoped table gets FORCE ROW LEVEL SECURITY plus a single
--      policy comparing "organizationId" to the session variable
--      app.current_org_id, which NestJS sets via `SET LOCAL` inside the same
--      transaction as the request (see ARCHITECTURE.md "Tenant context & RLS
--      enforcement").
--   3. current_setting(..., true) returns NULL instead of erroring when unset.
--      Comparing organizationId = NULL is always false — if the app ever forgets
--      to set the tenant context, every query returns zero rows. Fail closed,
--      not fail open.
--   4. organizations and users are NOT given a tenant-scoped RLS policy here —
--      they aren't scoped BY organizationId (a User can belong to many orgs;
--      Organization is the tenant boundary itself, not a child of one). Access
--      to these is governed by the app-layer Membership check in
--      TenantMembershipGuard/OrganizationsRepository, not by RLS on those two
--      tables directly — but that check itself queries `memberships`, which
--      DOES have FORCE RLS. Rule 2's org-context policy alone can never satisfy
--      it: "does this user belong to org X" and "which orgs does this user
--      belong to at all" both necessarily run BEFORE any org has been
--      selected, so app.current_org_id is never set for either lookup — under
--      rule 3 (fail closed), that's zero rows, always, for every user,
--      forever. This was a real bug (found Phase 7, in production), not a
--      hypothetical: the whole app was unusable past login. Rule 7 is the fix.
--   5. roles, permissions, role_permissions have no V1 policy — Permission and
--      system Roles (organizationId IS NULL) are shared reference data, not
--      per-tenant secrets. Revisit when V2 adds per-org custom roles.
--   6. user_preferences has no policy — scoped by userId, not organizationId;
--      protected by the API checking req.user.id, not by RLS.
--   7. memberships gets a SECOND, ADDITIONAL policy (Postgres combines
--      multiple permissive policies with OR) scoped to SELECT only: a row is
--      also visible if its userId matches app.current_user_id, a session
--      variable set via `SET LOCAL` by TenantMembershipGuard and
--      OrganizationsRepository.findAllForUser specifically for their own
--      pre-org-context lookups — see DECISIONS.md "The memberships RLS gap".
--      INSERT/UPDATE/DELETE are still governed exclusively by rule 2's
--      org-context policy; this addition only ever widens what's readable,
--      never what's writable.
--   8. currencies has no policy — same reasoning as rule 5: global reference
--      data (ISO 4217 codes), not per-tenant. companies/countries/brands/
--      websites, which reference it, are all normally tenant-scoped.

-- ── Roles ───────────────────────────────────────────────────────────────
-- Run once per environment, not per migration. Password/credentials are
-- managed via Neon's dashboard / environment secrets, never committed here.
--
-- CREATE ROLE mantraos_migrator WITH LOGIN;      -- owns the schema; used by `prisma migrate`
-- CREATE ROLE mantraos_app WITH LOGIN;           -- used by the NestJS app at runtime
-- GRANT USAGE ON SCHEMA public TO mantraos_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mantraos_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mantraos_app;
--
-- mantraos_app must NOT be the table owner and must NOT be a superuser —
-- table owners bypass RLS by default even with FORCE RLS unless they are
-- also stripped of BYPASSRLS, which is more fragile than simply using a
-- non-owner role for runtime traffic.

-- ── Deletion governance ─────────────────────────────────────────────────

ALTER TABLE "user_deletion_grants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_deletion_grants" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "user_deletion_grants"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "audit_logs"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Identity (org-scoped tables only — see note 4 above) ───────────────

ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "memberships"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));
-- See design note 7: lets a user see their own membership rows across every
-- org they belong to, before any org has been selected (X-Organization-Id
-- validation, and the "which orgs am I in" listing itself, both need this).
CREATE POLICY user_self_visibility ON "memberships"
  FOR SELECT
  USING ("userId" = current_setting('app.current_user_id', true));

-- ── Global (Company/Country/Brand/Website) — currencies is deliberately
-- excluded, same as roles/permissions: global reference data, not per-tenant.

ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "companies"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "countries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "countries" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "countries"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brands" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "brands"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "websites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "websites" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "websites"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── CRM ──────────────────────────────────────────────────────────────────

ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "customers"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contacts" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "contacts"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Products ─────────────────────────────────────────────────────────────

ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "categories"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "products"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Inventory ────────────────────────────────────────────────────────────

ALTER TABLE "warehouses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "warehouses" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "warehouses"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "stock_levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_levels" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "stock_levels"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "inventory_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_transactions" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "inventory_transactions"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Sales ────────────────────────────────────────────────────────────────

ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quotes" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "quotes"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "quote_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quote_lines" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "quote_lines"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "sales_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_orders" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "sales_orders"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "sales_order_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_order_lines" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "sales_order_lines"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "shipments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipments" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "shipments"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "shipment_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipment_lines" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "shipment_lines"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Purchasing ───────────────────────────────────────────────────────────

ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "suppliers"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_orders" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "purchase_orders"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "purchase_order_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_order_lines" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "purchase_order_lines"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "goods_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "goods_receipts" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "goods_receipts"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "goods_receipt_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "goods_receipt_lines" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "goods_receipt_lines"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "expenses"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Marketing ────────────────────────────────────────────────────────────

ALTER TABLE "segments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "segments" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "segments"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "email_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_templates" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "email_templates"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "campaigns"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Sales pipeline & billing (Sub-phase C) ──────────────────────────────

ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opportunities" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "opportunities"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "invoices"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Support (Sub-phase C) ────────────────────────────────────────────────

ALTER TABLE "support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_tickets" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "support_tickets"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Notifications ────────────────────────────────────────────────────────

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "notifications"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- ── Settings ─────────────────────────────────────────────────────────────

ALTER TABLE "organization_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_settings" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "organization_settings"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));
