# TODO

## Phase 7 — Deployment (in progress)

- [x] Git repo initialized, initial commit pushed to [github.com/deepakchanana15/mantra-os](https://github.com/deepakchanana15/mantra-os)
- [x] Real production `AUTH_JWT_SECRET` generated (not committed, not posted in chat — see DEPLOYMENT.md)
- [x] `DEPLOYMENT.md` runbook written for the account-level steps (Neon prod project, two Vercel projects, env vars)
- [x] Fresh Neon prod project provisioned (`mantra-os-prod`), migrated (2 migrations), RLS applied (78 statements), RBAC seeded (63 permissions, 5 roles, 257 role-permission links)
- [ ] `apps/api` Vercel project created and deployed (Step 2 — needs your Vercel account)
- [ ] `apps/web` Vercel project created and deployed (Step 3)
- [ ] Live deployment verified end-to-end (Step 4)
- [ ] Deploy on Vercel Hobby accepted as a known ToS risk for now — see DECISIONS.md "Phase 7 launch decisions"
- [ ] Production domain name — deferred, launching on default `*.vercel.app` subdomains (see DECISIONS.md)
- [ ] No CI yet — Vitest/verify-*.js suite doesn't run automatically on push; add before more than one contributor touches this repo

## Live database setup — done

- [x] Provision Neon Postgres project (`mantra-os`, free tier — see DECISIONS.md for the auto-suspend/storage tradeoff notes)
- [x] Create the `mantraos_app` runtime role, granted + RLS applied — `packages/db/scripts/setup-app-role.js` (re-runnable)
- [x] Run first migration — 33 tables live
- [x] Verify RLS actually isolates tenants, not just that policies applied without error — `packages/db/scripts/verify-rls.js`
- [x] Seed Permission catalog + five system roles + RolePermission bundles — `packages/db/scripts/seed-rbac.js` (re-runnable), verified counts match design

## Authentication — done (self-hosted, replacing Firebase)

- [x] Firebase Authentication replaced entirely — see [DECISIONS.md](DECISIONS.md) "Self-hosted authentication replaces Firebase"
- [x] `AuthModule`: login, forgot-password, reset-password, bcrypt + signed JWT, reset emails via Resend
- [x] Verified end-to-end against the live database and a running server — `packages/db/scripts/verify-auth.js`

## Phase 5 — Frontend: complete, all V1 domains built

- [x] Next.js app shell: sidebar/topbar, ⌘K command palette, org switcher (full reload on switch, by design)
- [x] Locked design system wired into Tailwind/CSS variables (light + dark)
- [x] Auth flow: login/forgot/reset-password pages, httpOnly cookie session, route protection via middleware
- [x] Customers (the reference vertical slice), Contacts, Products, Categories, Warehouses, Inventory (stock + ledger + adjustments), Quotes, Sales Orders, Shipments, Suppliers, Purchase Orders, Goods Receipts, Marketing (Segments/Templates/Campaigns), Settings (org info/Members/Deletion Access), Reports
- [x] Shared `components/domain/` patterns: `SearchInput`, `DeleteEntityButton`, `ExportCsvButton`, `LineItemsEditor`
- [x] Full end-to-end verification — `packages/db/scripts/verify-frontend-e2e.js` (19/19 checks), including live Purchasing→Inventory and Sales→Inventory flows with real stock-quantity math
- [x] **Critical bug found and fixed**: `TenantContextInterceptor` was never registered (`APP_INTERCEPTOR`) — the RLS transaction mechanism had never actually been active. See [DECISIONS.md](DECISIONS.md).
- [x] **Three more bugs found finishing the remaining domains**: an RSC serialization violation (functions passed Server→Client Component), `emit()` vs `emitAsync()` on the deletion-notification event, and Prisma's 5s interactive-transaction timeout being too tight for multi-step flows (Shipment/GoodsReceipt creation) over real network latency. See [DECISIONS.md](DECISIONS.md) "Three more real bugs found completing Phase 5's remaining 8 domains".

## Still needed before real end-user traffic

- [ ] Real Resend API key + verified sending domain (currently a placeholder value; explicitly deferred past Phase 7 launch — see DECISIONS.md "Phase 7 launch decisions")
- [ ] Decide when to move off Neon's free tier — trigger is "real daily usage annoyed by cold starts," not a specific storage number (see DECISIONS.md)
- [ ] User invite/onboarding flow — Identity currently assumes a User row already exists, and now also needs an initial password set as part of that flow (not just a Firebase account created)
- [ ] Contacts search — `ContactsRepository.findAll` doesn't implement text search yet (only `customerId` filtering); the Contacts page has no search box until this exists, rather than shipping one that silently does nothing

## Explicitly out of scope for V1 (not forgotten)

- [ ] Richer Segment filter DSL — V1 supports one field (`customerType`); see `segment-filter.dto.ts`
- [ ] Campaign send batching/rate-limiting beyond what Resend itself provides, if send volume ever needs it

## Phase 6 — Testing: done

- [x] Scope decided: risk-based — Vitest unit tests for genuinely risky pure/near-pure logic, keep `verify-*.js` as the integration/e2e layer rather than porting it into a framework (it was already catching real bugs — see TODO.md Phase 5 notes)
- [x] Extracted pure status-computation logic out of `ShipmentsService`/`GoodsReceiptsService` into `shipment-status.util.ts`/`goods-receipt-status.util.ts`, unit tested (10 cases total)
- [x] Extracted `rolesFor()` out of `seed-rbac.js`'s inline logic into `apps/api/src/common/permissions/roles-for.ts`, imported back into the seed script from compiled `dist`, unit tested (7 cases, including one iterating every real `PERMISSIONS` key)
- [x] `DeletionGuardService` unit tested (11 cases) — Owner escalation floor, grant requirement, revoked grants, self-delete blocking, and the 1/day rate limit applying even to the Owner
- [x] New `packages/db/scripts/verify-governance.js` — real HTTP integration checks for the 1/day deletion rate limit, Viewer role write denial (403), and cross-org data isolation via RLS (404 by ID + absence from list), 7/7 passing
- [x] Full suite confirmed green together: 28/28 Vitest unit tests, 19/19 `verify-frontend-e2e.js`, 7/7 `verify-governance.js`, `verify-rls.js`, `verify-auth.js`

## Later

- [ ] Custom role builder (V2) — schema already supports it via Role/RolePermission, UI does not exist yet
- [ ] Domain-scoped deletion grants (V2, if needed) — V1 grants are global per user
