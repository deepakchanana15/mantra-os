# Database

Prisma schema: [`packages/db/prisma/schema.prisma`](packages/db/prisma/schema.prisma) — 45 models across 11 domains, validated with `npx prisma validate`.
RLS policies: [`packages/db/prisma/rls-policies.sql`](packages/db/prisma/rls-policies.sql) — applied after every `prisma migrate deploy`, not managed by Prisma directly.

**Two gaps found and fixed while building the Phase 4 backend** (not caught during the original Phase 3 design pass): `Category` and `Warehouse` were missing `createdBy`/`updatedBy` despite being business entities like every other soft-deletable table, and `GoodsReceipt` had no line items at all — meaning it couldn't express receiving less than a full purchase order, unlike `Shipment`/`ShipmentLine`. Both fixed; see [DECISIONS.md](DECISIONS.md).

## Conventions

- **UUID primary keys** everywhere (`@default(uuid())`).
- **Soft deletes** (`deletedAt DateTime?`) on business entities a user creates and might remove — Customer, Product, SalesOrder, etc.
- **Audit columns** (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`) on the same business entities.
- **`organizationId` on every tenant-scoped table** — including line-item tables (QuoteLine, SalesOrderLine, ShipmentLine, PurchaseOrderLine, InvoiceLine), which were deliberately denormalized to carry it directly rather than requiring a join through their parent. RLS policies work as a simple column comparison this way instead of a subquery — simpler and faster at the 10M-row scale target.
- **No `@@map` to snake_case** — Postgres handles quoted camelCase columns fine, and staying camelCase end-to-end avoids a translation layer between Prisma models and raw SQL. Table names *are* mapped to snake_case (`@@map("sales_orders")`) purely for readability when reading raw SQL/psql output.

## Append-only ledger tables — not soft-deletable

**InventoryTransaction, AuditLog, GoodsReceipt, and GoodsReceiptLine have no `deletedAt` and are never updated.** They're event logs, not editable records:

- InventoryTransaction is the 10M-row scale target — a ledger of every stock movement. Corrections happen by writing a new offsetting `ADJUSTMENT` row, never by editing or deleting history. `StockLevel` is the derived current-state snapshot, kept in sync as transactions are written — InventoryTransaction is the source of truth, not StockLevel.
- AuditLog is itself the record of what happened to everything else (including deletions) — it would defeat its own purpose if it were editable.
- GoodsReceipt is a receipt event, not a draft — once goods arrive, that fact doesn't change.

This is separate from — and more strict than — the general deletion governance system ([DECISIONS.md](DECISIONS.md)), which applies to editable business records like Customer or SalesOrder. Ledger tables sit outside that system entirely: not even the Owner can delete a ledger row.

## Indexing — InventoryTransaction

The one table explicitly sized to 10M+ rows gets three indexes matching its actual query patterns:

```prisma
@@index([organizationId, warehouseId, productId, createdAt])  // "stock history for this product in this warehouse"
@@index([organizationId, createdAt])                           // "recent activity across the org" (dashboard/reports)
@@index([referenceType, referenceId])                           // "which transactions did this Sales Order/PO generate"
```

Every other tenant-scoped table gets a single `@@index([organizationId])` at minimum — cheap to add now, expensive to discover missing later once tables hold real data.

## GoodsReceiptLine

Added during Phase 4 backend work alongside `Shipment`/`ShipmentLine`'s pattern — a `GoodsReceipt` now has line items (`purchaseOrderLineId`, `quantity`), letting a receipt cover part of a purchase order rather than forcing an all-or-nothing receive. Append-only, like its parent `GoodsReceipt` — no `deletedAt`, no update path.

## Row-Level Security

Implements the mechanism decided in [ARCHITECTURE.md](ARCHITECTURE.md#tenant-context--rls-enforcement-request-lifecycle): every tenant-scoped table gets `FORCE ROW LEVEL SECURITY` plus one policy comparing `organizationId` to `current_setting('app.current_org_id')`, which NestJS sets via `SET LOCAL` inside each request's transaction.

**Fail closed:** `current_setting(..., true)` returns `NULL` instead of erroring when unset. Comparing `organizationId = NULL` is always false — if the app ever forgets to set the tenant context, queries return zero rows, not another tenant's data.

**Two database roles, required for RLS to mean anything:**
- `mantraos_migrator` — owns the schema, runs `prisma migrate`. Table owners bypass RLS by default.
- `mantraos_app` — used by the NestJS app at runtime. Not the owner, not a superuser, so RLS applies to it in full.

If the app connected as the schema owner, `FORCE ROW LEVEL SECURITY` would still be bypassed and every policy in `rls-policies.sql` would be decorative. This is a required operational step for Phase 7, not optional hardening — noted in [TODO.md](TODO.md).

**Deliberately no RLS policy on:** `organizations` and `users` (they aren't scoped *by* organizationId — a User belongs to many orgs, and Organization is the tenant boundary itself, not a child of one; access is governed by the app-layer Membership check instead), `roles`/`permissions`/`role_permissions` (shared reference data for V1's fixed system roles — revisit once V2 adds per-org custom roles), `user_preferences` (scoped by `userId`, protected by the API checking `req.user.id`, not by tenant), and `currencies` (global ISO 4217 reference data, same reasoning as roles/permissions). `companies`/`countries`/`brands`/`websites` (added Phase 8) get the standard `organizationId`-based policy like every other tenant-scoped table.

`memberships` additionally has a second, narrower policy (`user_self_visibility`, SELECT only) letting a user see their own membership rows before any org has been selected — see [DECISIONS.md](DECISIONS.md) "The memberships RLS gap" for why the org-context policy alone can never satisfy that lookup.

## Other schema notes

- **Money fields** use `Decimal(12,2)` (Product.unitPrice/unitCost, *Line.unitPrice/unitCost) — exact decimal arithmetic, not floating point, for anything financial.
- **Json fields** used deliberately for genuinely semi-structured data that doesn't need to be queried/joined on: addresses (Customer, Supplier, Warehouse), Segment's saved filter criteria, Campaign stats. Normalizing these into extra tables would add joins with no query benefit.
- **Role.organizationId is nullable** — `NULL` means a shared system role (Owner/Admin/Manager/Member/Viewer, available to every org); a set value is the V2 custom-role extension point. V1 only ever creates the null-org rows.

## Migration workflow

Prisma lives in its own workspace package so `packages/db` can be depended on by both `apps/api` and any future script without duplicating the schema:

```
npm run db:validate     # from repo root — checks schema.prisma
npm run db:format       # normalizes formatting
```

**Live since 2026-07-19** — a real Neon project exists, the first migration ran (32 tables), and `packages/db/scripts/` has the one-time-per-environment setup:

| Script | Purpose |
|---|---|
| `setup-app-role.js` | Creates/updates the `mantraos_app` role, grants it table privileges, applies `rls-policies.sql`, writes a fresh connection string to `apps/api/.env`. Re-runnable. |
| `verify-rls.js` | Inserts real test data and queries it as the restricted app role to prove tenant isolation actually works, not just that policies applied — cleans up after itself. |
| `seed-rbac.js` | Seeds the Permission catalog and five system roles' bundles, reading permission keys from the compiled `apps/api` output so it can't drift from what the API checks. Re-runnable. |
| `verify-auth.js` | Creates a real bcrypt-hashed test user and drives the actual running API over HTTP: wrong password (401), correct password (200 + token), protected route with/without that token (200/401). Requires the API to be running. Cleans up after itself. |

Running these against a new environment (staging, production) in Phase 7 means: populate that environment's `packages/db/.env` with its own Neon owner connection string, run `prisma migrate deploy`, then the scripts above in order (`verify-auth.js` last, once the API is deployed and running against that environment).
