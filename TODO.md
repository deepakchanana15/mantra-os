# TODO

## Phase 7 — Deployment (in progress)

- [x] Git repo initialized, initial commit pushed to [github.com/deepakchanana15/mantra-os](https://github.com/deepakchanana15/mantra-os)
- [x] Real production `AUTH_JWT_SECRET` generated (not committed, not posted in chat — see DEPLOYMENT.md)
- [x] `DEPLOYMENT.md` runbook written for the account-level steps (Neon prod project, two Vercel projects, env vars)
- [x] Fresh Neon prod project provisioned (`mantra-os-prod`), migrated (2 migrations), RLS applied (78 statements), RBAC seeded (63 permissions, 5 roles, 257 role-permission links)
- [x] `apps/api` Vercel project created and deployed (`mantra-os-api.vercel.app`) — live, verified against the real prod database (login/validation/auth all confirmed working end-to-end). Took real debugging: see DECISIONS.md "Phase 7 deploy debugging" — the actual root cause was `serverless-http` not supporting Vercel at all (only AWS/Azure), not anything database-related, though the Neon serverless driver adapter switch made along the way is a correct, permanent improvement in its own right.
- [x] `apps/web` Vercel project created and deployed (`mantra-os-web-zoc9.vercel.app`)
- [x] **Major bug found and fixed during live verification**: the entire app was unusable past login, in both dev and prod — `TenantMembershipGuard` and `OrganizationsRepository.findAllForUser` both queried `memberships` (FORCE RLS) outside any transaction, which doesn't bypass RLS the way it was assumed to. See DECISIONS.md "The memberships RLS gap".
- [ ] Live deployment verified end-to-end (Step 4) — pending final re-check after the RLS fix redeploys
- [ ] Deploy on Vercel Hobby accepted as a known ToS risk for now — see DECISIONS.md "Phase 7 launch decisions"
- [ ] Production domain name — deferred, launching on default `*.vercel.app` subdomains (see DECISIONS.md)
- [ ] No CI yet — Vitest/verify-*.js suite doesn't run automatically on push; add before more than one contributor touches this repo
- [x] Audit `packages/db/scripts/*.js` for implicit `new PrismaClient()` (no explicit `datasources.db.url`) — all fixed: `create-demo-user.js`, `verify-rls.js`, `verify-frontend-e2e.js`, `verify-governance.js`, `seed-rbac.js`, `setup-app-role.js` all now read `packages/db/.env` explicitly and pass the URL via `datasources.db.url`.

## Live database setup — done

- [x] Provision Neon Postgres project (`mantra-os`, free tier — see DECISIONS.md for the auto-suspend/storage tradeoff notes)
- [x] Create the `mantraos_app` runtime role, granted + RLS applied — `packages/db/scripts/setup-app-role.js` (re-runnable)
- [x] Run first migration — 33 tables live
- [x] Verify RLS actually isolates tenants, not just that policies applied without error — `packages/db/scripts/verify-rls.js`
- [x] Seed Permission catalog + five system roles + RolePermission bundles — `packages/db/scripts/seed-rbac.js` (re-runnable), verified counts match design

## Authentication — done (self-hosted, replacing Firebase)

- [x] Firebase Authentication replaced entirely — see [DECISIONS.md](DECISIONS.md) "Self-hosted authentication replaces Firebase"
- [x] `AuthModule`: login, forgot-password, reset-password, bcrypt + signed JWT, reset emails via Brevo (switched from Resend — see [DECISIONS.md](DECISIONS.md) "Switched email provider to Brevo")
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

- [x] Real Brevo API key connected (dev), confirmed working with a real test send — see "2026-07-23 — Switched email provider to Brevo" below
- [ ] Verified sending domain (a `mantrasports.com.au` subdomain) — in progress but not finished; `BREVO_FROM_EMAIL` is still a placeholder until this lands, and prod hasn't been given the real API key/webhook secret yet either
- [ ] Decide when to move off Neon's free tier — trigger is "real daily usage annoyed by cold starts," not a specific storage number (see DECISIONS.md)
- [ ] Self-service invite-by-email flow — Owner/Admin can now create a teammate's login directly (see "2026-07-23 — Feature batch" below), but there's still no invite-email step; the Owner shares the temporary password out of band (this is a deliberate design choice, not just blocked on email — see DECISIONS.md "Member creation (no self-service invite)")
- [ ] Contacts search — `ContactsRepository.findAll` doesn't implement text search yet (only `customerId` filtering); the Contacts page has no search box until this exists, rather than shipping one that silently does nothing

## Explicitly out of scope for V1 (not forgotten)

- [ ] Richer Segment filter DSL — V1 supports one field (`customerType`); see `segment-filter.dto.ts`
- [ ] Campaign send batching/rate-limiting beyond what Brevo itself provides, if send volume ever needs it
- [ ] Per-recipient tracking (who specifically opened/clicked, not just aggregate rates) — deliberately deferred, see DECISIONS.md "Switched email provider to Brevo"

## Phase 6 — Testing: done

- [x] Scope decided: risk-based — Vitest unit tests for genuinely risky pure/near-pure logic, keep `verify-*.js` as the integration/e2e layer rather than porting it into a framework (it was already catching real bugs — see TODO.md Phase 5 notes)
- [x] Extracted pure status-computation logic out of `ShipmentsService`/`GoodsReceiptsService` into `shipment-status.util.ts`/`goods-receipt-status.util.ts`, unit tested (10 cases total)
- [x] Extracted `rolesFor()` out of `seed-rbac.js`'s inline logic into `apps/api/src/common/permissions/roles-for.ts`, imported back into the seed script from compiled `dist`, unit tested (7 cases, including one iterating every real `PERMISSIONS` key)
- [x] `DeletionGuardService` unit tested (11 cases) — Owner escalation floor, grant requirement, revoked grants, self-delete blocking, and the 1/day rate limit applying even to the Owner
- [x] New `packages/db/scripts/verify-governance.js` — real HTTP integration checks for the 1/day deletion rate limit, Viewer role write denial (403), and cross-org data isolation via RLS (404 by ID + absence from list), 7/7 passing
- [x] Full suite confirmed green together: 28/28 Vitest unit tests, 19/19 `verify-frontend-e2e.js`, 7/7 `verify-governance.js`, `verify-rls.js`, `verify-auth.js`

## Phase 8 — Global multi-country/multi-company/multi-brand architecture (Sub-phases A/B/C done)

See DECISIONS.md "Global multi-country, multi-company, multi-brand architecture" for the full design and phasing rationale.

- [x] Sub-phase A: `Currency`, `Company`, `Country`, `Brand`, `Website` master data — schema, RBAC (Owner/Admin), settings UI, seeded with the 6 current countries. Live in prod.
- [x] Sub-phase B: `companyId`/`countryId` scoping on Customer/Quote/SalesOrder/PurchaseOrder/Supplier; `brandId` on Product/Campaign. DTOs, repositories, and create-form selectors updated for all 7 entities (Campaign has no frontend UI at all yet, so its field is backend-only). Global master-data reads reopened to all roles so Manager/Member can populate the selectors. Live in prod.
- [x] Sub-phase C: minimal `Opportunity`, `Invoice`, `SupportTicket` entities, scoped to Company/Country from the start. Full CRUD backend + RLS + RBAC + create/list frontend pages, no edit/detail pages yet (matches the existing Supplier precedent). Opportunity not yet linked to Quote. Live in prod, verified via local suite + a manual smoke test of all three new endpoints (create/list/update/duplicate-invoice-number-rejected/delete-governance).
- [x] Linking Opportunity → Quote, itemized Invoice lines, and SupportTicket assignment/SLA all shipped — see "2026-07-23 — Feature batch: Product currency, Opportunity→Quote link, Invoice lines, SupportTicket SLA, Member creation" below
- [ ] Follow-on, still explicitly deferred: currency conversion/exchange rates, the full tax rule engine, price lists, shipping zones, the extended multi-dimensional permission model, dashboard/report filtering by Company/Country/Brand

## 2026-07-22 fixes and Goods Receipt upload + Expense

- [x] Sidebar nav now scrolls independently instead of clipping items when the browser is zoomed in
- [x] Products list: missing category include fixed (list always showed "—" even when set), delete button added to match every other domain list
- [x] Product price now shows the currency code (e.g. "USD 1,198.00") instead of a bare "$" — still hardcoded to USD everywhere; a real per-product/per-country currency needs a design decision (Product has no Company/Country link yet, only Brand) — **resolved 2026-07-23, see below**
- [x] Goods Receipt upload + minimal `Expense` entity — see DECISIONS.md "Goods receipt upload + Expense". Vercel Blob (client-direct-upload), manual entry (no OCR), auto-calculated expense amount reviewed inline on the same form before submit. Live in prod. (Single-file upload superseded the next day by multi-document support below.)
- [x] Vercel Blob store connected to `mantra-os-web-zoc9`'s Development environment (with a real `BLOB_READ_WRITE_TOKEN`, since local `next dev` has no OIDC context) — local uploads now fully testable. See DECISIONS.md "Attachments switched to private access" for what this uncovered: the store is actually private-mode, `MultiFileUpload` was hardcoded to request `public` (would have failed outright on a real prod upload), and the team decided to keep it private and build real signed-URL viewing rather than switch the store to public.

## 2026-07-23 — Feature batch: multi-document attachments, Supplier phones, Sales Channel

See DECISIONS.md "Feature batch: multi-document attachments, Supplier phones, Sales Channel" for full design rationale.

- [x] Goods Receipt and Expense both support multiple attached documents (supplier invoice, delivery challan, packing slip, GRN copy, receipts — PDF/JPG/JPEG/PNG) via a shared polymorphic `Attachment` table, replacing the single `receiptFileUrl` field from the day before. Shared `MultiFileUpload` frontend component.
- [x] Expense's Supplier field was already optional at the schema/DTO level — added the standalone "New Expense" page that didn't exist before (previously only created via the Goods Receipt flow), with Supplier defaulting to "No supplier" for petty cash/parking/courier-style expenses.
- [x] Supplier full address exposed in the frontend (schema already supported it since Phase 5, just never had a form field) + new `SupplierPhone` model (multiple numbers, one marked primary, free-text label). Supplier's first-ever detail/edit page (`suppliers/[id]`) — previously create + list only.
- [x] SalesOrder gained a required-going-forward `salesChannel` (Online/Offline) with conditional sub-fields (Online: Website/Store vs. Marketplace + free-text order reference; Offline: a 7-value categorical sub-type), filterable via `?salesChannel=` and a "Sales by channel" breakdown on Dashboard + Reports.
- [x] Regression caught during verification: `verify-frontend-e2e.js`'s existing Sales Order creation step predated the new required field — fixed the test, not the requirement.
- [x] Full local verification suite + a 16-check manual smoke test (attachments, optional-supplier expense, supplier phone replace, sales channel required-validation + filtering + dashboard breakdown) all pass. Live in prod.

## 2026-07-23 — Feature batch: Product currency, Opportunity→Quote link, Invoice lines, SupportTicket SLA, Member creation

See DECISIONS.md "Feature batch: Product currency, Opportunity→Quote link, Invoice lines, SupportTicket SLA, Member creation" for full design rationale.

- [x] Product currency now follows Company/Country (`country.currency` → `company.baseCurrency` → USD fallback) instead of being hardcoded — `companyId`/`countryId` added to Product, resolved client-side in `apps/web/lib/product-currency.ts`.
- [x] Quote linked to Opportunity via optional `opportunityId`; Opportunities list gained a "Create Quote" action that deep-links into the Quote form and prefills the customer.
- [x] Invoice gained optional itemized `InvoiceLine`s (product/quantity/unit price), server-computed total when lines are present; the original single-`amount` path still works unchanged. New Invoice detail page.
- [x] SupportTicket gained `assignedToId` (validated against org membership) and a fixed `slaHours` (24/36/48/72) with a stored, computed `dueAt`; overdue tickets flagged in the list and detail views. New `GET /v1/support-tickets/assignable-members` endpoint and SupportTicket detail/edit page.
- [x] Owner/Admin can create a teammate's login directly from Settings (email/name/temporary password/role) — new `POST /v1/members`, `members:create` permission. Existing users invited into a new org get a new membership rather than a duplicate user; same email in the same org is rejected as a 409. No invite email yet — deliberate design choice, not a Resend/Brevo dependency (see DECISIONS.md "Member creation (no self-service invite)").
- [x] Campaign frontend UI explicitly parked, not part of this batch, per user request. **Correction (2026-07-23):** turned out this already existed — see the Brevo entry below.
- [x] Full local verification suite (Vitest, `verify-frontend-e2e.js`, `verify-governance.js`, `verify-rls.js`, `verify-auth.js`) plus an 18-check manual smoke test covering all five features, including the member-creation conflict and cross-org-existing-user paths.
- [x] Prod migration, `invoice_lines` RLS, and RBAC re-seed applied. Pushed to `main` (commit `6dbc9a1`) — Vercel auto-deploy in progress; pending user confirmation the live deploy is up.
- [x] Vercel Blob connected to the `mantra-os-web-zoc9` Development environment (with a real `BLOB_READ_WRITE_TOKEN`) — uncovered the store is private-mode, not public as originally designed. See DECISIONS.md "Attachments switched to private access": `MultiFileUpload` now requests `private` access (would have failed outright in prod otherwise), new `/api/attachments/view-url` route issues short-lived signed URLs, new shared `AttachmentLink` component replaces every plain attachment `<a href>`. Verified end-to-end locally (raw URL confirmed unreachable, signed URL confirmed working, unauthenticated request confirmed refused). Pushed (commit `a03a7fb`).

## 2026-07-23 — Switched email provider to Brevo; real Campaign send-tracking

See DECISIONS.md "Switched email provider to Brevo" for full rationale (why Brevo over Resend, what the webhook/tagging design looks like, what's still open).

- [x] `ResendService` replaced by `BrevoService` everywhere it was used (password reset, deletion-governance owner notifications, Campaign sends) — same thin-wrapper shape, now returns `{success, messageId}` instead of `void` so callers that care (Campaigns) can tell whether a send actually worked.
- [x] New `POST /v1/webhooks/brevo` — public (Brevo isn't a logged-in user), verified via a shared-secret header, folds `delivered`/`uniqueOpened`/`click`/bounce-family events into `Campaign.stats`. Aggregate tracking only for V1 (rates, not per-recipient detail).
- [x] Campaign sends now tagged `campaign:<id>` + `org:<organizationId>` so the webhook (no JWT/org header available) knows which tenant's RLS context to run the stats update under.
- [x] New `packages/db/scripts/register-brevo-webhook.js` — one-off, registers/updates the webhook against a given deployed API URL (Brevo needs a real reachable URL, can't target localhost).
- [x] Marketing page shows real Opened/Clicked counts and rates per campaign now, not just a bare Sent count; corrected its "sent via Resend" copy and ARCHITECTURE.md's stale "Campaign has no frontend UI at all" claim (a real one already existed).
- [x] Full local verification: `apps/api` typecheck/tests/build clean, an 11-check smoke test covering the real create-segment/template/campaign/send flow against the actual Brevo API plus simulated webhook callbacks (including a bad-secret rejection), confirming `Campaign.stats` updates correctly end to end.
- [x] Live in prod: `BREVO_API_KEY`/`BREVO_FROM_EMAIL`/`BREVO_FROM_NAME`/`BREVO_WEBHOOK_SECRET` set in `mantra-os-api`'s Vercel Production env vars, deploy confirmed healthy (real request against the live URL, not just a successful build), webhook registered against `https://mantra-os-api.vercel.app/v1/webhooks/brevo` via `register-brevo-webhook.js` and confirmed via Brevo's own webhook list.
- [ ] Still needed: verified sending domain (`mantrasports.com.au` subdomain, in progress) — `BREVO_FROM_EMAIL` is a placeholder until then; update it in both dev and prod together once verification lands.

## Later

- [ ] Custom role builder (V2) — schema already supports it via Role/RolePermission, UI does not exist yet
- [ ] Domain-scoped deletion grants (V2, if needed) — V1 grants are global per user
