# Architecture Decisions

Record of significant, hard-to-reverse decisions. Newest first.

---

## 2026-07-23 — Feature batch: Product currency, Opportunity→Quote link, Invoice lines, SupportTicket SLA, Member creation

**Context:** Five gaps surfaced while reviewing what Sub-phase C shipped as "minimal versions" (see the 2026-07-21 entry) — the user approved all five in one pass, deferring only the Campaign frontend (still backend-only, unrelated to this batch) and the Contacts-vs-Customers question (answered as a modeling clarification, not a code change: Customer is the organization/account, Contact is a person at that Customer).

**Product currency follows Company/Country, not hardcoded USD:** `Product` gained optional `companyId`/`countryId` (same nullable, indexed, not-backfilled pattern as Sub-phase B). Effective display currency is resolved client-side with a clear precedence: `country.currency` (most specific) → `company.baseCurrency` (fallback) → a hardcoded USD fallback (last resort, for products with neither set) — implemented once in `apps/web/lib/product-currency.ts` rather than repeated inline at each call site. No currency conversion is implied or performed; this only changes which currency's symbol/code is displayed.

**Opportunity linked to Quote:** `Quote` gained an optional `opportunityId` FK. Deliberately loose coupling — a Quote can exist without an Opportunity (walk-in/direct quotes stay valid), and an Opportunity can have zero, one, or many Quotes. The Opportunities list page gained a "Create Quote" action that deep-links to `/quotes/new?opportunityId=...`, which prefills the customer from the Opportunity. This is the "concrete conversion flow" the Sub-phase C entry said this link was waiting on.

**Invoice line items, server-computed total:** `Invoice.amount` is now optional at the DTO level; a new `InvoiceLine` table (productId, quantity, unitPrice — same shape as Quote/SalesOrder/PurchaseOrder's existing line tables) can be supplied instead. When `lines` is present, `InvoicesService` computes `amount` server-side (`Σ quantity × unitPrice`) rather than trusting a client-supplied total for an itemized invoice; when absent, the original single-`amount` behavior is unchanged for backward compatibility. Exactly one of `amount`/`lines` is required — enforced in the service, not the DTO, since "one of two fields" isn't a single-field validator.

**SupportTicket assignment + SLA:** Added `assignedToId` (must be an existing membership in the ticket's org — validated, not just any user ID), `slaHours` (a fixed enum of 24/36/48/72, not free-entry, matching what was actually requested), and a stored `dueAt` computed as `createdAt + slaHours` at creation time (and recomputed from `createdAt` if `slaHours` is later changed on update). `dueAt` is stored rather than derived on every read so it stays trivially sortable/filterable without a computed-column or view. A new `GET /v1/support-tickets/assignable-members` endpoint lists the org's members for the assignment dropdown — had to be declared before the `:id` route in the controller, or Nest's route matching would capture the literal path segment as an `:id` param.

**Member creation, no self-service invite:** The Owner (or Admin) can create a teammate's login directly from Settings — email, name, a temporary password they set and hand over out-of-band, and a role (Owner/Admin/Manager/Member/Viewer — the existing five system roles, not a new "trial/testing" tier). Explicitly rejected the user's own suggested shortcut of giving every new teammate Owner-equivalent access "if it's hard to give them lower access" — it isn't hard; the role picker already existed and real role separation from day one avoids an unwind-privileges migration later. If the email already belongs to a user elsewhere in the system, that user is reused and just gets a new membership in this org (supports one person legitimately belonging to multiple organizations); if the email is already a member of *this* org, the request is rejected as a 409 conflict. No email is sent — this is intentionally a stopgap until Resend is wired up (see TODO.md); the Owner is expected to share the temporary password directly.

**Reversibility:** High across the board. Product's currency derivation is a display-only convention, reversible by changing the fallback chain in one file. The Quote↔Opportunity link is a nullable FK. Invoice's dual amount/lines input is additive — nothing that used the old single-`amount` shape breaks. SupportTicket's SLA options can be widened without a migration (`slaHours` is a plain `Int`, the fixed list is an application-level `@IsIn` choice). Member creation's "no invite email" gap is the one piece expected to change soon, once Resend is connected — at that point this becomes an invite-link flow instead of a direct-password flow, without touching the underlying role/membership model.

---

## 2026-07-23 — Feature batch: multi-document attachments, Supplier phones, Sales Channel

**Context:** A single "please implement" request covering four areas: (1) multiple documents per Goods Receipt, (2) multiple receipts per Expense with an optional Supplier, (3) Supplier full address + multiple phone numbers with a primary flag, (4) a required Sales Channel field on SalesOrder with conditional sub-fields, filterable and reportable.

**Multi-document attachments — one polymorphic `Attachment` table, not per-entity join tables:** Replaces the single `receiptFileUrl` string added a day earlier on `GoodsReceipt`/`Expense` (no real prod data depended on it yet, so replaced outright rather than migrated). `Attachment` has `entityType` (`GOODS_RECEIPT` | `EXPENSE`) + `entityId`, no foreign key — same pattern `AuditLog` already uses, since a real FK can't point at "whichever table entityType names." A shared `AttachmentsRepository` (registered in the `@Global()` CommonModule) gives every domain service `findByEntity`/`findByEntities`/`createMany` without re-deriving the same Prisma queries. Extensible to future attachment-bearing entities without a new table each time.

**Supplier — address needed no schema change:** `Supplier.address` was already the shared `AddressDto` Json shape (line1/line2/city/state/postalCode/country) since Phase 5 — only the frontend never exposed it. The real new work was **multiple phone numbers**: a `SupplierPhone` model (label, number, isPrimary), free-text label (not an enum) since "mobile, office, WhatsApp, etc." is explicitly open-ended. The legacy `Supplier.phone` column stays and is kept in sync with whichever phone is marked primary (or the first one), so anything still reading the singular field — existing list displays, exports — keeps working unchanged. Supplier also gained its first real edit page (`suppliers/[id]`); before this, Suppliers had create + list only, no detail/edit view at all.

**Sales Channel — required going forward, nullable at the DB level:** `SalesOrder.salesChannel` (`ONLINE`/`OFFLINE`) is enforced as required by `CreateSalesOrderDto` (no `@IsOptional()`), but the column itself is nullable — existing orders predate the field and aren't backfilled, same "required going forward, not retrofitted" pattern used throughout Sub-phase B. Sub-fields: `onlineChannelType` (Website/Store vs. Marketplace) + free-text `orderReference` for Online; a single `offlineChannelType` enum (Walk-in, Phone Order, WhatsApp, Email, Sales Representative, Distributor/Dealer, Exhibition/Tournament) for Offline — read as one categorical choice per channel, not independent fields, since the requirement listed them as a flat bullet list under "optionally capture." Filterable via `?salesChannel=` on the list endpoint; a `salesByChannel` breakdown (orders + revenue per channel, current month) was added to the existing dashboard-summary endpoint and surfaced on both Dashboard and Reports pages — no new report infrastructure, matching ARCHITECTURE.md's "Reports and Dashboard are not domains."

**Regression caught and fixed:** making `salesChannel` required broke `verify-frontend-e2e.js`'s existing Sales Order creation step (it predates the field). Fixed by adding `salesChannel: "OFFLINE"` to that test's payload — the right fix per the instruction to keep existing functionality working, not loosening the new requirement.

**File upload UX, unchanged from the prior entry:** still Vercel Blob, client-direct upload via `/api/uploads`, `public` access with random-suffixed URLs — see "Goods receipt upload + Expense" below. The Goods Receipt/Expense forms now use a shared `MultiFileUpload` component (multiple files, each uploads on selection, removable before submit) instead of the single-file control built a day earlier.

**Reversibility:** High across the board. The polymorphic Attachment table can gain new `entityType` values without a migration. Supplier's legacy `phone` sync is a convenience, not a constraint — dropping it later just means displays relying on it would need to switch to `phones`. The Sales Channel nullable-at-DB-level choice means no data was fabricated for historical orders.

---

## 2026-07-22 — Goods receipt upload + Expense (manual entry, not OCR)

**Context:** Goods are received against hard-copy vendor receipts, and staff wanted the ability to attach the physical receipt and have it become an expense record. Options ranged from AI/vision extraction to plain manual entry with an attached scan. User chose manual entry (no OCR/AI), always-review-before-posting, and a minimal Expense entity built now rather than deferred — matching the "minimal version" precedent set by Sub-phase C.

**Storage — Vercel Blob, not a new vendor:** Since MantraOS is 100% Vercel (locked Phase 1 decision), file storage uses Vercel Blob rather than introducing S3/Cloudinary. The store is connected to `mantra-os-web-zoc9`'s Production/Preview (and ideally Development) environments and uses Vercel's OIDC-based auth (`BLOB_STORE_ID` + `BLOB_WEBHOOK_PUBLIC_KEY`, no static `BLOB_READ_WRITE_TOKEN`) — the `@vercel/blob` SDK picks this up automatically when running on Vercel's infrastructure. This means the actual file-upload flow can't be exercised from local `next start`; local verification covered every other part of the flow (Goods Receipt/Expense creation, linking, RLS), with the upload itself confirmed on a Vercel deployment.

**Client-direct upload, not routed through the file's bytes via NestJS:** `apps/web/app/api/uploads/route.ts` uses `@vercel/blob/client`'s `handleUpload` to issue short-lived client tokens; the browser uploads straight to Blob storage. This keeps a multi-MB phone photo from ever hitting Vercel's serverless function body-size limit, and keeps it out of the NestJS API entirely — that API project doesn't even have the Blob env vars connected. Authorization on the upload route is a baseline "logged in with an org selected" check (same as every other Next.js route), not a full RBAC permission check — the real gate is that the uploaded file only becomes useful data when a GoodsReceipt/Expense record referencing its URL is created, which does go through full RBAC. An uploaded-but-unused file sitting in Blob storage carries no risk.

**Access level — `public`, not `private`:** Vercel Blob's `private` access requires generating a signed URL every time a file is displayed; `public` blobs are reachable by anyone with the exact URL, but the URL includes a random suffix (`addRandomSuffix: true`) making it unguessable. Given the app is already authenticated end-to-end and this isn't public-facing content, `public` was chosen as the minimal option — upgradeable to `private` + signed URLs later if a stricter requirement emerges.

**Expense is its own entity, not folded into GoodsReceipt:** `GoodsReceipt` stays append-only (per DATABASE.md); `Expense` is a separate, soft-deletable entity with optional links to `GoodsReceipt`/`PurchaseOrder`/`Supplier`, `companyId`/`countryId` scoping from the start (Sub-phase C's pattern), and its own `receiptFileUrl` (same upload, referenced from both records) — so it can stand alone for expenses with no goods receipt (rent, software) in the future without a schema change.

**Flow — no OCR, review is the form itself:** The New Goods Receipt form gained a file-attach control and an "Also record as an expense" section that's pre-filled (vendor from the PO's supplier, amount auto-summed from received-quantity × unit-cost) but fully editable before the single submit — this *is* the review step; there's no separate confirmation screen. On submit, the GoodsReceipt is created first, then the Expense (two sequential API calls, not one combined transaction) — keeps each write within its existing service's own transaction scope rather than risking Prisma's interactive-transaction timeout across two entities' worth of side effects (see the Phase 5 timeout bug elsewhere in this file).

**RLS applied via the same narrow one-off pattern as Sub-phase C** (`packages/db/scripts/apply-expenses-rls.js`) — not `setup-app-role.js`, which also rotates the `mantraos_app` password and would require simultaneously updating Vercel's env var.

**Reversibility:** High. Nothing here is hard to walk back — the manual-entry choice can be upgraded to OCR/AI extraction later without a schema change (the DTOs already accept the same shape an extraction step would produce), and `public` blob access can move to `private` + signed URLs if needed.

---

## 2026-07-21 — Global multi-country, multi-company, multi-brand architecture (design)

**Context:** MantraOS must expand from modeling a single business (Mantra Sports) to an enterprise architecture that supports multiple legal entities, countries, brands, and websites — without a future database redesign. Current countries: US, Canada, Australia, New Zealand, Netherlands, Germany; next planned: India. This is a foundational re-architecture, not a feature — it touches the domain model broadly and needed its own design pass before any schema work, the same way Phases 1–2 did for the original architecture.

**Decision 1 — Tenancy hierarchy:** `Organization` remains the RLS tenant boundary, **unchanged** from the Phase 1 lock (see "Multi-tenancy: shared schema, `organization_id` + Postgres RLS" below) — it's still what lets MantraOS itself serve unrelated future customers, not just Mantra Sports. A new `Company` entity sits *beneath* Organization, representing a legal entity (Mantra Sports Australia Pty Ltd, Mantra Sports USA LLC, etc.). `Country` belongs to `Company` (not the other way around — confirmed by the requirement itself: "Warehouse belongs to a country. Country belongs to a company."), and `Warehouse` belongs to `Country`. `Brand` and `Website` are cross-cutting: a Brand belongs to the Organization (a brand isn't tied to one legal entity), a Website references a Country and a Brand. Full chain: `Organization → Company → Country → Warehouse`, with `Brand`/`Website` attached at the Organization/Country level respectively.

**Decision 2 — Phasing:** built as three checkpointed sub-phases rather than one large change against a live production system:
- **Sub-phase A:** master data — `Currency`, `Company`, `Country`, `Brand`, `Website`, plus `countryId` added to the existing `Warehouse` table. Seeded with the 6 current countries.
- **Sub-phase B:** `companyId`/`countryId`/`brandId` scoping added to existing entities (`Customer`, `Quote`, `SalesOrder`, `PurchaseOrder`, `Supplier` get company/country; `Product`, `Campaign` get brand).
- **Sub-phase C:** three entities referenced by the requirement but not yet built anywhere in MantraOS — `Opportunity` (pre-Quote sales pipeline stage), `Invoice`, `SupportTicket` — added as minimal versions with the new scoping from the start.

Currency conversion (exchange rates, transaction-currency tracking), the tax engine, price lists, shipping zones, the extended multi-dimensional permission model (Company/Country/Warehouse/Department/Role/Brand), and dashboard/report filtering by these new dimensions are **explicitly deferred to their own follow-on phases** after this foundational layer lands — each is a substantial subsystem on its own, not a field addition.

**Decision 3 — Multi-language scope, narrowed:** "Multi-language" means tagging records (Country's default language, a Customer/Contact's preferred language for correspondence) — **not** translating the MantraOS application UI itself. Full UI internationalization (every label/button/screen in English/German/Dutch/French/Hindi) is a separate, large frontend initiative, out of scope here until there's a concrete need to open it.

**Decision 4 — Tax and pricing, framework not data:** `Country.taxPercentage` is a simple configurable decimal for V1 — enough that nothing is hardcoded — not yet the full rule engine implied by "GST/VAT/CGST/SGST/IGST" (multiple stacked, dated, compound rules). That engine, and the full price-list system (per-country, per-customer-type-tier pricing), are follow-on phases once real rates/price data exist to build and test against. Building the engine before there's real data to validate it against would mean designing blind.

**Reversibility:** The hierarchy decision (Company beneath Organization, not replacing it) is the one genuinely hard-to-reverse call here — every other piece (tax engine sophistication, price list structure, UI translation) can be deepened later without touching what Sub-phase A ships. Getting the hierarchy wrong would mean redoing every table that references Company/Country.

**Sub-phase B, shipped:** `companyId`/`countryId` (nullable, indexed, `ON DELETE SET NULL`) added to `Customer`, `Quote`, `SalesOrder`, `PurchaseOrder`, `Supplier`; `brandId` added to `Product`, `Campaign`. All optional — existing rows aren't backfilled, set going forward. DTOs, repositories (create and, where a general update method exists, update), and create-form selectors (`CompanyCountrySelect`, `BrandSelect` in `apps/web/components/domain/`) were updated for all 7 entities. Campaign has no frontend UI at all yet (pre-existing gap, unrelated to this work), so its `brandId` is backend-only for now.

**RBAC adjustment made during Sub-phase B:** Sub-phase A had restricted `companies`/`countries`/`brands`/`websites` to Owner/Admin for *all* actions, including reads. That blocked Manager/Member — who can create Customers/Quotes/SalesOrders/etc. — from reading the very lists needed to populate the new selectors. Reopened reads to all roles (`rolesFor` in `apps/api/src/common/permissions/roles-for.ts`) while keeping writes (create/update/delete) Owner/Admin-only, matching the generic CRUD-group pattern used elsewhere. This was a deliberate, user-confirmed change, not an oversight fix.

**Sub-phase C, shipped:** three new tenant-scoped entities, none of which existed anywhere in MantraOS before — `Opportunity` (pre-Quote sales pipeline stage: name, stage enum, estimated value, expected close date, notes), `Invoice` (a single amount, not itemized lines; optionally tied to a `SalesOrder`, unique per-org invoice number), `SupportTicket` (subject, description, status, priority). All three get `companyId`/`countryId` from the start (not retrofitted like Sub-phase B) and a required `customerId`. Full CRUD backend (DTOs, repositories, services, controllers), RLS (`tenant_isolation` policy, `FORCE ROW LEVEL SECURITY`, same shape as every other tenant table), and RBAC permission keys fall through to the generic CRUD-group default (read = all roles, write = Owner/Admin/Manager/Member) — no special-casing needed, unlike the Global master-data resources. Frontend: list + create pages only (no edit or detail page, matching the existing Supplier precedent) for all three, plus a new "Support" nav group. Opportunity is intentionally **not yet linked to Quote** ("pre-Quote pipeline stage" is descriptive, not a foreign key) — that wiring is deferred until there's a concrete conversion flow to build against, consistent with Decision 2's "framework not data" pattern elsewhere in this phase.

**RLS applied without rotating the app-role password:** the established `setup-app-role.js` re-run pattern also rotates `mantraos_app`'s password and rewrites `apps/api/.env` — safe for dev, but running it against prod would require simultaneously updating Vercel's env var or the live API loses its DB connection mid-deploy. Wrote a narrower one-off (`packages/db/scripts/apply-subphase-c-rls.js`) that applies only the three new tables' `ENABLE`/`FORCE ROW LEVEL SECURITY` + `CREATE POLICY` statements via the owner connection already in `packages/db/.env`, idempotent the same way (`already exists` errors ignored). Table-level grants needed no equivalent script — Sub-phase A's `ALTER DEFAULT PRIVILEGES` already covers every table the owner creates from that point forward.

---

## 2026-07-21 — Customer type taxonomy: 20 sports-business types replace generic INDIVIDUAL/COMPANY

**Decision:** `Customer.type` moves from a generic `INDIVIDUAL | COMPANY` enum to 20 specific values reflecting how Mantra Sports actually segments its customers: `USER, STORE, ACADEMY, CLUB, COACH, PROFESSIONAL, SCHOOL, COLLEGE_UNIVERSITY, ASSOCIATION, CORPORATE, GOVERNMENT, TEAM, DISTRIBUTOR, DEALER, FRANCHISE, EVENT_ORGANIZER, RENTAL_PROVIDER, NGO_FOUNDATION, INFLUENCER_CREATOR, OEM_PRIVATE_LABEL`. Labels and descriptions (e.g. "Store — Retail sports shop, online retailer, or distributor") live in `apps/web/lib/customer-types.ts`, the single source of truth for the frontend; `apps/api` only validates against the Prisma-generated enum, it doesn't need the display text.

**Default:** `USER` (was `COMPANY`) — the highest-volume, most generic case for a new customer record.

**Existing data:** both dev and prod had a handful of test/demo customers using the old values (no real customer data existed yet at this point). Remapped via the migration itself: `INDIVIDUAL → USER`, `COMPANY → STORE`.

**Migration mechanics worth remembering:** Postgres can't cast a text value that isn't a member of the *target* enum, so a straight `ALTER COLUMN ... TYPE new_enum USING old::text::new_enum` fails the moment it hits an `'INDIVIDUAL'` or `'COMPANY'` row — neither exists in the new type. The column has to pass through a plain `text` intermediate state first: drop default → cast to `text` (accepts anything) → `UPDATE` the old values to their new equivalents → cast `text` to the new enum (now every row already holds a valid value) → swap the enum type in under the old name → restore the default. `prisma migrate dev` couldn't be used to author this (it requires an interactive terminal, unavailable here); the migration folder was created by hand from `prisma migrate diff --script` output, with the `UPDATE` statements inserted at the right point.

**Reversibility:** Low once real customer data exists and staff start relying on specific values in reporting/segmentation — renaming or removing a value later means another data migration, not just a schema edit. Adding *new* values later is cheap (a plain `ALTER TYPE ... ADD VALUE`).

---

## 2026-07-21 — The memberships RLS gap: the app was unusable past login, in both dev and prod

**What happened:** While verifying the live Phase 7 deployment end-to-end (a real browser login), the org picker showed "No organizations yet" for an account that definitely had one. Direct testing traced it to a real, deep bug: `TenantMembershipGuard` (validates `X-Organization-Id` against a real Membership row, on every tenant-scoped request) and `OrganizationsRepository.findAllForUser` (lists the orgs a user belongs to, for the org switcher) both query the `memberships` table via the raw `PrismaService`, outside any transaction — on the theory that skipping the transaction "bypasses" RLS. It doesn't. `mantraos_app` is not the table owner; Postgres RLS applies to every query it runs, transaction or not. With `app.current_org_id` never set (impossible here — neither of these lookups has an org to set it to yet, that's the entire point of both), `memberships`'s existing policy (`organizationId = current_setting('app.current_org_id')`) evaluates to `NULL` for every row, which RLS treats as "not visible." **Every authenticated, tenant-scoped request has been silently returning zero rows since RLS became genuinely active** — a design gap present since Phase 3 (`rls-policies.sql`'s own design notes already flagged that `organizations`/`users` access "is governed by the app-layer Membership check," but the policy that check actually needs was never added), masked the whole time by the Phase 5 bug where `TenantContextInterceptor` was never registered at all (see the entry below) — RLS wasn't really enforced then either, so this never had a chance to surface until now.

**Confirmed, not assumed:** direct raw queries against both the dev and prod databases, as `mantraos_app`, with correct data present and no context set, reproduced empty results identically in both environments. This ruled out a Vercel-specific or deployment-specific cause before any fix was attempted.

**Fix:** a second, additive RLS policy on `memberships`, scoped to `SELECT` only:
```sql
CREATE POLICY user_self_visibility ON "memberships"
  FOR SELECT
  USING ("userId" = current_setting('app.current_user_id', true));
```
Postgres combines multiple permissive policies with OR, so a row is now visible if *either* the org context matches (the existing policy, still the only thing governing INSERT/UPDATE/DELETE) *or* the user context matches. `TenantMembershipGuard` and `findAllForUser` each now wrap their one query in a minimal `$transaction` that does `SET LOCAL app.current_user_id = '<the authenticated user's id>'` first — the same `SET LOCAL`-inside-a-transaction pattern `TenantContextInterceptor` already uses for org context, just scoped to user identity for these two specifically-pre-org-context lookups. The userId comes from the JWT's `sub` claim (server-signed, not raw client input), matching the existing trust boundary used for `organizationId` interpolation elsewhere.

**Verified before shipping:** re-ran the full local suite after the fix — 28/28 Vitest, 19/19 `verify-frontend-e2e.js`, 7/7 `verify-governance.js` (which specifically re-proves cross-org isolation and Viewer-role denial through this exact guard), `verify-rls.js`, `verify-auth.js` — then applied the same policy to prod and redeployed before considering this closed.

**A related, separate finding along the way:** several `packages/db/scripts/*.js` files (`verify-frontend-e2e.js`, `verify-governance.js`, `create-demo-user.js`) call `new PrismaClient()` with no explicit `datasources.db.url`, relying on the generated client's implicit `.env` auto-discovery. That auto-discovery resolves relative to wherever `prisma generate` was last run from — after `apps/api`'s build started running its own `prisma generate` (Phase 7's build-fix work), these scripts silently started connecting as `mantraos_app` instead of the intended schema owner, which is what surfaced *this* RLS gap in the first place (a `membership.create()` failing loudly, rather than the guard/repository queries failing silently the way they'd been doing all along). Fixed the same way `verify-rls.js` already did it — read `packages/db/.env` explicitly, pass the URL via `datasources.db.url`. `seed-rbac.js` and `setup-app-role.js` are still unfixed — see TODO.md.

**Reversibility:** High. The new policy only ever widens what's SELECT-visible, never what's writable — it cannot introduce a cross-tenant write path. The code changes are two small, self-contained transaction wrappers.

---

## 2026-07-21 — Phase 7 deploy debugging: apps/api hung with FUNCTION_INVOCATION_TIMEOUT

**What happened:** After the prod Neon database was provisioned and `apps/api` was deployed to Vercel, every request hung for the full function duration and returned `FUNCTION_INVOCATION_TIMEOUT` rather than a real response. Several real, separate issues were found and fixed in sequence — some were genuine, worthwhile fixes on their own merits, but none were actually what was causing every request to hang. That root cause turned out to be present since `api/index.ts` was first written in Phase 4, unrelated to anything database-related:

1. **No Output Directory.** Vercel's zero-config build expects a `public/` folder even for a pure-serverless project with zero static assets; without one the build fails outright with "No Output Directory named 'public' found." Fixed with an intentionally empty `apps/api/public/.gitkeep` — see ARCHITECTURE.md's Deployment section for why nothing in it is ever actually served. Stays regardless.
2. **Bootstrap failures were silent.** `api/index.ts`'s handler didn't catch a `NestFactory.create()`/`app.init()` rejection, so a genuine config error (briefly, a missing `RESEND_API_KEY` before it was correctly added to Vercel) looked identical to a hang — both ended in the same timeout. Fixed by catching and caching the failure, returning an immediate 500 with the real error message instead of retrying (and re-hanging on) the same failing bootstrap every request. Stays regardless.
3. **Region mismatch, a reasonable but insufficient fix.** Vercel had deployed the function to Mumbai (`bom1`) against a Neon database in `us-east-1`. Pinned `apps/api/vercel.json`'s `"regions": ["iad1"]` to match — worth doing for latency regardless, but the hang persisted after deploying it, proving cross-region distance wasn't the cause.
4. **A plausible-but-wrong diagnosis: IPv6.** Neon's pooler hostname resolves to both AAAA (IPv6) and A (IPv4) records, and Vercel's Node.js serverless runtime doesn't reliably support outbound IPv6. `dns.setDefaultResultOrder("ipv4first")` made no difference at first (Prisma's query engine is a native binary with its own Rust networking stack, never touching Node's `dns` module), so as a next step `PrismaService` was switched to Neon's serverless driver adapter (`@prisma/adapter-neon` + `@neondatabase/serverless`, WebSocket-based) — Neon's own documented, supported solution for serverless/edge runtimes with unreliable raw TCP/IPv6 egress, not a workaround. This was verified carefully before trusting it (the same connection string via the adapter connecting in ~2s locally, and — since this touches the single most safety-critical path in the system — a full re-run of the RLS `SET LOCAL app.current_org_id` transaction pattern against the real prod database through the adapter, confirming tenant isolation still held). **The adapter switch is being kept** — it's still the correct way to connect to Neon from a serverless runtime — but Vercel's own logs then showed `Nest application successfully started` on fresh cold starts, proving the database connection worked fine even while every request *still* hung. That ruled out the database layer entirely.
5. **The actual root cause: `serverless-http` doesn't support Vercel.** Its own README lists only AWS and Azure as supported providers, and its returned handler expects an AWS API Gateway-style `(event, context)` argument shape. `api/index.ts` was calling it as `cachedHandler(req, res)` — Vercel's own native Node.js function signature (the same shape `http.createServer` uses), not what `serverless-http` expects. Passing the wrong-shaped arguments didn't error, it just hung indefinitely — consistent with every single symptom observed (bootstrap always succeeded, yet every request, even to unmatched routes, hung the full function duration, regardless of database region, IPv6, or connection mechanism). **Fix:** removed `serverless-http` entirely. An Express app is itself directly callable as `(req, res)` — Vercel's actual supported pattern for Node.js functions — so `bootstrap()` now just returns the raw Express app and the handler calls it directly. No adapter needed.

**Why this took several iterations rather than one diagnosis:** every symptom looked identical from the outside (a stuck deployment, `FUNCTION_INVOCATION_TIMEOUT`), and the database was a reasonable first suspect — Neon's dual-stack DNS and Vercel's IPv6 limitations are real, documented gotchas, and the driver-adapter switch was the right call regardless of whether it was *the* bug. The decisive piece of evidence was Vercel's own Function Logs showing `Nest application successfully started` on an invocation that *still* never returned a response — that's the point where the database was fully ruled out and the search moved to the request-dispatch path itself, which is where the actual (much older, Phase-4-vintage) bug was.

**Reversibility:** All fixes are small and low-risk. The driver adapter switch and the `serverless-http` removal both touch central request/connection handling but were verified locally (full rebuild, restart, `verify-auth.js`, `verify-frontend-e2e.js` at 19/19) before being trusted, not shipped on faith.

---

## 2026-07-20 — Phase 7 launch decisions: Hobby plan accepted, fresh prod Neon, Resend and custom domain deferred

**Decision, made explicitly at Phase 7 kickoff:**
1. **Deploy on Vercel Hobby**, not Pro, despite the Hobby tier being licensed for non-commercial use only (flagged again at this exact decision point per [DECISIONS.md](DECISIONS.md) "Hosting: 100% Vercel") and MantraOS running real Mantra Sports business data being commercial use by definition. Accepted knowingly as a cost-conscious tradeoff, same posture as the earlier Firebase-cost-driven auth decision.
2. **Provision a fresh Neon project for production**, separate from the project used for local dev and the Phase 3–6 `verify-*.js`/demo-account testing. The dev project keeps all its test/demo data as a scratch database going forward; it is never promoted to prod.
3. **Resend stays on its placeholder key at launch.** Password reset and deletion-governance owner-notification emails will fail silently (the underlying request still succeeds) until a real key + verified sending domain is configured. Deferred rather than blocking Phase 7 on it.
4. **Custom domain deferred**, per the "Production domain name" item already flagged in TODO.md since Phase 5 — both Vercel projects launch on default `*.vercel.app` subdomains.

**Why chosen over the alternatives:** all four are the same shape of tradeoff — ship now on the free/default path, accept a known and explicitly-recorded gap, revisit before it actually matters (real paying-adjacent usage, a real user depending on password reset, a real need for a branded URL). None of these are irreversible: Pro is an upgrade click, Resend is a key swap, a domain is a DNS setting, and the fresh-Neon choice only affects which project *is* prod, not the schema/RLS design itself.

**Consequences to design around:** none of the four change any code path — they're deployment-environment configuration, not architecture. See [DEPLOYMENT.md](DEPLOYMENT.md) for the concrete runbook this produced.

**Reversibility:** High on all four — see "why chosen" above.

---

## 2026-07-20 — Phase 6 testing scope: risk-based, not exhaustive-per-endpoint

**Decision:** Add Vitest to `apps/api` for unit tests, but scope them narrowly to genuinely risky pure/near-pure logic rather than writing a unit test for every CRUD endpoint. Keep the hand-rolled `verify-*.js` scripts (real HTTP, against a live Neon DB) as the integration/e2e layer rather than porting them into a framework like Supertest+Jest.

**What got unit tested and why:**
- `DeletionGuardService` (11 cases) — the actual governance logic (Owner escalation floor, grant requirement, revoked grants, self-delete blocking, 1/day rate limit) lives here; every write endpoint just calls through it, so this one file is the real risk surface, not each controller.
- `rolesFor()` (7 cases) — extracted from inline logic in `seed-rbac.js` into `apps/api/src/common/permissions/roles-for.ts` (imported back into the seed script from compiled `dist`, same pattern already used for `PERMISSIONS`) specifically so it could be unit tested at all; a wrong bundle here silently mis-grants or mis-denies every resource for a whole role.
- `computeShippingStatus()` / `computeReceivingStatus()` (10 cases) — extracted the order-line-quantity-vs-shipped/received math out of `ShipmentsService`/`GoodsReceiptsService` into pure functions (`shipment-status.util.ts`, `goods-receipt-status.util.ts`); status transitions (PENDING → PARTIALLY_SHIPPED → SHIPPED, never regressing) are exactly the kind of off-by-one-prone logic worth pinning down independent of the DB.

**What deliberately did not get unit tests:** simple CRUD controllers/services/repositories (Customers, Products, Warehouses, Suppliers, etc.) — they share one already-proven pattern (`findAll`/`findOneOrThrow`/`create`/`update`/`softDelete` via `DeletionGuardService`), and `verify-frontend-e2e.js` already exercises that pattern end-to-end for the reference vertical slice (Customers) plus page-load checks for the rest.

**New integration coverage** — `packages/db/scripts/verify-governance.js`, following the existing `verify-*.js` pattern (real servers, real HTTP, real cookies, cleans up after itself): the 1/day deletion rate limit actually blocking a second delete (even for the Owner), Viewer role denied 403 on write while still allowed to read, and cross-org isolation via RLS (a second org's Owner gets 404 by ID and the record is absent from their list, not just "assumed from `verify-rls.js`'s lower-level check").

**Result, run together:** 28/28 Vitest unit tests, 19/19 `verify-frontend-e2e.js`, 7/7 `verify-governance.js`, plus `verify-rls.js` and `verify-auth.js` — all green on the first full run after writing the new tests.

**Why chosen over a broader or Jest/Supertest-based suite:** the `verify-*.js` scripts have already caught 5 real bugs across Phases 4–5 (the never-registered `TenantContextInterceptor`, the RSC serialization boundary violation, `emit()` vs `emitAsync()`, the 5s transaction timeout, plus the RLS cast bug earlier in Phase 3) precisely because they run against a real remote database and the full request pipeline — porting them into a mocked test framework would trade away the thing that's actually been finding bugs. Unit tests fill the specific gap those scripts can't reasonably cover: exhaustive branch coverage of pure logic (every role/resource combination, every rate-limit edge case) without needing a live server for each case.

**Reversibility:** High — test scope is a judgment call, not a structural commitment; more unit tests can be added incrementally to any file if it turns out to need them.

---

## 2026-07-20 — Three more real bugs found completing Phase 5's remaining 8 domains

**What happened:** Building out Products, Warehouses, Inventory, Contacts, Sales (Quotes/SalesOrders/Shipments), Purchasing (Suppliers/PurchaseOrders/GoodsReceipts), Marketing, Settings, and Reports, then extending `verify-frontend-e2e.js` to exercise the one piece of real cross-domain business logic in the new work (Purchasing→Inventory via GoodsReceipt, Sales→Inventory via Shipment, with actual stock-quantity math checked) surfaced three more bugs that `tsc` and `next build` both passed cleanly on:

1. **RSC serialization boundary violation.** The generic `ExportCsvButton` took a `columns` prop with accessor *functions* (`(row) => row.sku`). Used from a Server Component (`products/page.tsx`), this crashed at runtime — React Server Components cannot pass functions to Client Components across that boundary. Not a type error; TypeScript has no concept of this constraint. Fixed by changing the component's contract to plain serializable data: the Server Component pre-maps rows into `Record<string,string>` before handing them to the button, no functions cross the boundary. Customers' original export button avoided this by accident (it formatted internally rather than taking an accessor-function prop) — the *generic* version reintroduced the problem.
2. **`eventEmitter.emit()` instead of `emitAsync()`.** `DeletionGuardService.recordAndNotify()` fires the `record.deleted` event for `RecordDeletedListener` (async — writes a Notification, calls Resend) to pick up. `emit()` does not await async listeners; the request's transaction was committing and closing while the listener was still mid-flight, throwing "Transaction already closed." This directly contradicts the synchronous-listener assumption written into ARCHITECTURE.md's "Domain events" section back in Phase 2 — the assumption was correct in spirit (listener work should complete within the request) but the implementation used the wrong emitter method to actually guarantee it.
3. **Prisma's default 5000ms interactive-transaction timeout was too tight** for Shipment/GoodsReceipt creation specifically — each does several sequential remote round-trips (create the record, one write per inventory line via `InventoryService.recordMovement()`, then a status-recalculation query re-reading the parent order) inside the one per-request transaction `TenantContextInterceptor` opens. Simple CRUD stays well under 5s; these multi-write flows didn't, once real network latency to Neon was actually exercised rather than assumed. Fixed by raising the transaction timeout to 15000ms.

**Why none of this was caught earlier:** Every one of these needs the exact combination of (a) a real remote database connection, (b) a real multi-step business flow, not simple CRUD, and (c) the full request pipeline actually running — which is precisely what didn't exist until this phase's `verify-frontend-e2e.js` extended to cover Purchasing→Inventory and Sales→Inventory specifically, rather than stopping at "the page loads."

**Reinforces the lesson from the earlier `TenantContextInterceptor` bug**: build-clean and type-clean are necessary, not sufficient. The project's verification bar going forward is "a real multi-step flow, driven through the full stack, against the live database" — and that bar keeps finding real bugs every time it's actually applied to new surface area, which is the argument for continuing to apply it rather than treating earlier clean runs as proof the pattern is now safe.

**Reversibility:** All three fixes are contained and low-risk (a component contract, an emitter method, a config number). No data corruption occurred — the bugs manifested as request failures, not silent wrong data.

---

## 2026-07-20 — Critical bug found: TenantContextInterceptor was never actually running

**What happened:** Building the Phase 5 frontend and driving it against the real API for the first time (`packages/db/scripts/verify-frontend-e2e.js` — real login, real org selection, real customer create/view/delete over HTTP with real cookies) surfaced that `TenantContextInterceptor` — the piece that opens the RLS transaction and populates `TenantContextService`'s `AsyncLocalStorage` — was built in Phase 4, referenced in `CommonModule`'s providers, but **never registered as `APP_INTERCEPTOR` and never applied via `@UseInterceptors` on any controller**. It simply never ran. Every tenant-scoped repository call had been silently missing its RLS transaction context this entire time.

**Why earlier verification didn't catch it:** Every prior boot/smoke test either (a) failed before reaching the database (no live DB yet), or (b) only exercised `@SkipTenantContext()` routes (`/v1/organizations` list, `/v1/auth/login`) which correctly never needed the interceptor. `verify-auth.js` tested login end-to-end but never called a tenant-scoped route. Nothing had driven a request through the *full* guard-and-interceptor pipeline against real data until the frontend existed to do it. This is exactly why ARCHITECTURE.md's Phase 4 verification claims were scoped to "DI wiring and route mapping" — that was true and insufficient; it was never a claim that the RLS mechanism itself had been exercised.

**Fix:** Registered `TenantContextInterceptor` globally via `APP_INTERCEPTOR` in `app.module.ts`. This immediately surfaced a second bug: `AuthController`'s routes (login/forgot-password/reset-password have no guards at all; `me` only has `JwtAuthGuard`) crashed with `Cannot read properties of undefined (reading 'id')` because the now-global interceptor assumed `req.user` always exists. Fixed by adding `@SkipTenantContext()` at the class level on `AuthController` — every route there is either pre-session or deliberately org-independent.

**Re-verified clean after both fixes**: all 9 checks in `verify-frontend-e2e.js` pass — login, org picker, org selection, dashboard (real KPI data), customer list/create/view/delete (including the Owner-escalation-floor deletion rule actually firing), and the no-session redirect.

**Lesson for how this project verifies work going forward:** "boots without error" and "DI resolves" are necessary but not sufficient — they don't prove a cross-cutting mechanism (guards, interceptors, RLS) is actually wired into the request path. Every phase from here should include at least one real request driven through the full pipeline against live data before being called verified, not just a successful build/boot.

**Reversibility:** N/A — this was a bug, not a design choice. No tenant data existed in the window this was broken (this session, pre-any-real-usage), so no cross-tenant data exposure ever occurred in practice; still treated with the severity a live RLS gap deserves.

---

## 2026-07-19 — Self-hosted authentication replaces Firebase

**Decision:** Firebase Authentication is removed entirely. `apps/api` now owns authentication directly: bcrypt-hashed passwords in the `users` table (`passwordHash`, replacing `firebaseUid`), a self-issued signed JWT (HS256, `AUTH_JWT_SECRET`) for sessions, and a `PasswordResetToken` table (stores only a SHA-256 hash of the reset token, never the raw value) for forgot/reset-password via Resend — the same email vendor already used for notifications.

**Why chosen:** User hit Firebase's paywall in practice ("asks for money even for hobby projects") and asked to move to something in the Vercel/Next.js ecosystem instead. The literal ask ("use Vercel instead") isn't possible — Vercel has no end-user identity product; its one adjacent feature, Passport, gates a *deployment URL* behind an *external* IdP and is Enterprise-only, contact-sales pricing. Auth.js (NextAuth) was considered as the realistic "stay in the Next.js ecosystem" option, but rejected as a **library dependency**: Auth.js's default session token is an encrypted JWE designed to be issued and verified by the *same* Next.js app, which is awkward to verify correctly from a separate NestJS API — exactly this project's actual topology (two Vercel projects, not one). Self-issuing a plain signed JWT sidesteps that mismatch entirely and costs nothing to run.

**Explicit tradeoff accepted:** the user chose traditional email + password over the initially-recommended magic-link (passwordless) approach. This means MantraOS now owns password hashing, validation, and a full reset flow — real security surface that a passwordless approach would have avoided. Mitigated with bcrypt (10 rounds), a hashed (not raw) reset token with a 1-hour expiry, and generic "invalid email or password" / "if an account exists..." responses that don't reveal account existence.

**Verified end-to-end against the live database**, not just compiled: wrong password → 401; correct password → real signed token; that token against a protected route → 200; no token → 401. See `packages/db/scripts/verify-auth.js`.

**Consequences:**
- The invite/onboarding flow (already flagged as out-of-scope-for-now in TODO.md) now also needs to set an initial password when a User row is created, not just exist.
- `apps/web` (Phase 5) needs its own login form + token storage (httpOnly cookie recommended) — there's no Auth.js session cookie magic to lean on, by design.

**Reversibility:** Medium. Swapping the hashing/JWT scheme later is contained to `AuthService`/`JwtAuthGuard`; migrating *existing* user passwords to a different scheme (or back to a third-party IdP) would need a re-authentication step for every user, same as any password-scheme migration anywhere.

---

## 2026-07-19 — First live database: RLS text/uuid bug found, RBAC seeded and verified

**What happened:** Provisioned the real Neon project, ran the first migration (32 tables), then hit a real bug applying `rls-policies.sql`: every policy cast the session variable to `::uuid`, but Prisma's `String` fields map to Postgres `text`, not a native `uuid` column — `text = uuid` has no valid operator. Fixed by comparing as text on both sides (removed all 52 `::uuid` casts). This is exactly the kind of thing that only surfaces against a real database, not from reading the schema.

**Verified, not assumed:** Wrote `packages/db/scripts/verify-rls.js` — inserts a real customer under one org, then queries it as the actual restricted `mantraos_app` role (not the schema owner) with no tenant context (0 rows, correct), the wrong org's context (0 rows, correct), and the right org's context (1 row, correct). All three passed against the live database.

**RBAC seeded from the single source of truth:** `packages/db/scripts/seed-rbac.js` reads `PERMISSIONS` from the already-compiled `apps/api` output (not a hand-copied list) and wires the five system roles per the `rolesFor()` rules in that script — delete-type permission keys are granted broadly (Owner/Admin/Manager/Member), since the real restriction on deleting a specific record is `DeletionGuardService`, not the role; `deletion_grants:manage` is Owner-only, matching the delegation design. Verified post-seed: Owner 63/63 permissions, Admin 62 (everything except `deletion_grants:manage`), Manager and Member 58 each (identical CRUD bundle), Viewer 16 (read-only), `deletion_grants:manage` held only by Owner.

**Also found:** Prisma rejects `null` inside a compound-unique `where` clause (`organizationId_key` with `organizationId: null` for system roles) — worked around with `findFirst` + manual create/update instead of `upsert()`.

**Reversibility:** The RLS fix is low-risk (caught before any real tenant data existed). The seed script is fully re-runnable (idempotent) if the permission catalog changes later.

---

## 2026-07-19 — Two schema gaps found and fixed while building domain modules

**Decision:** `Category` and `Warehouse` gained `createdBy`/`updatedBy` (were missing them since the original Phase 3 pass); `GoodsReceipt` gained a `GoodsReceiptLine` child table (previously had no line items at all).

**Why chosen:** Both were discovered organically while writing the actual NestJS modules, not by review — `DeletionGuardService.deleteWithGovernance()` needs `entityCreatedBy` to enforce the no-self-delete rule, which surfaced the missing audit columns the moment Categories/Warehouses needed delete endpoints. The GoodsReceipt gap surfaced when writing the receiving flow and realizing there was no way to express "received 8 of the 10 ordered" — a very ordinary procurement scenario that `Shipment`/`ShipmentLine` already handled correctly on the sales side.

**Why this happened:** The Phase 3 schema pass modeled all 9 domains in one sitting without a live database or real usage to test assumptions against. Writing the actual CRUD/business logic in Phase 4 is what exposed the gaps — a predictable cost of designing schema ahead of the code that uses it, not a one-off mistake.

**Reversibility:** High — both were caught before any real data existed. Adding nullable/new columns and a new child table costs nothing at this stage; the same fixes after production data existed would need real migrations with backfill.

---

## 2026-07-18 — Guard/interceptor split for tenant context

**Decision:** Membership validation (does this user actually belong to the requested org?) moved from the interceptor described in the Phase 2 sketch into a Guard (`TenantMembershipGuard`), which runs before a separate `PermissionGuard`. A slimmer `TenantContextInterceptor` now only opens the RLS transaction, reusing the org id the guard already validated.

**Why chosen:** Discovered while actually implementing the permission system — NestJS executes all Guards before any Interceptor, with no way to interleave them. `PermissionGuard` needs `req.membership` (role + permissions) to decide whether a route is allowed, but the original design had that data only becoming available inside an Interceptor, which runs too late. Splitting the membership lookup into a Guard fixes the ordering and, as a side benefit, means the lookup happens once and both `TenantMembershipGuard` and `PermissionGuard` share it — no duplicate query.

**Consequences:** Every tenant-scoped controller must apply guards in this exact order: `@UseGuards(FirebaseAuthGuard, TenantMembershipGuard, PermissionGuard)`. Getting the order wrong fails closed (guards throw before reaching the handler) rather than silently skipping a check, so this is safe to get wrong in the sense that it won't leak data — but it will break the route.

**Reversibility:** High — this is an internal request-pipeline detail, invisible to API consumers.

---

## 2026-07-18 — Ledger tables are never soft-deletable, not even by Owner

**Decision:** InventoryTransaction, AuditLog, and GoodsReceipt have no `deletedAt` and are never updated after creation. They sit entirely outside the deletion-governance system (Owner-delegated grants, above) — that system governs editable business records; these three are event logs where "deleting history" is never a valid operation for anyone, including the Owner.

**Why chosen:** InventoryTransaction is the 10M-row scale target and the source of truth for stock levels — allowing edits or deletions to it would let StockLevel and reality silently diverge with no way to reconstruct what actually happened. AuditLog recording deletions would be pointless if it were itself deletable. This wasn't explicitly asked for but follows the same governance instinct behind the deletion-grant system above: irreversible actions get deliberate guardrails, and a mutable audit/ledger table is a contradiction in terms.

**Consequences:** Corrections to inventory counts happen via a new offsetting `ADJUSTMENT` transaction, never by editing a past row — this needs to be a first-class, easy action in the Phase 4/5 UI, not a workaround.

**Reversibility:** High to loosen (just allow edits later, though it would undermine the audit guarantee), effectively impossible to tighten retroactively once any ledger row has ever been edited or deleted.

---

## 2026-07-18 — RLS requires two Postgres roles (migrator vs. runtime app)

**Decision:** Two database roles: `mantraos_migrator` (schema owner, runs Prisma migrations) and `mantraos_app` (used by the NestJS app in production). The app must connect as `mantraos_app`, never as the schema owner.

**Why chosen:** Postgres table owners bypass Row-Level Security by default, even with `FORCE ROW LEVEL SECURITY` set. If the NestJS app connected using the same role that owns the schema (the natural default if you only ever create one DB user), every RLS policy in `rls-policies.sql` would silently do nothing — the multi-tenancy isolation decided early on would exist in name only. This is a real Postgres behavior, not a style preference.

**Reversibility:** Low once real tenant data exists under the wrong role — this needs to be right from the first Neon provisioning step in Phase 7 (or whenever a real database is first connected), not fixed after the fact.

---

## 2026-07-18 — Deletion governance: Owner-delegated grants, not role-based delete

**Decision:** Delete is not part of any role's base permission bundle. It's off by default for everyone except the Owner, who can delegate it to specific individual users by user ID. Even with a grant, no one can delete a record they personally created — the Owner is the sole exception, as the top of the escalation chain. Every deletion is soft, audit-logged, emails the Owner, and is capped at 1 per day per person performing the deletion.

**Why chosen:** User's explicit requirement, arrived at through several rounds of clarification. The core insight: at the target scale (1M customers, 10M inventory transactions), deletion is a categorically different risk than editing — a bad edit is correctable, an unnoticed bad deletion on business-critical records is not. The initial ask was a role-based escalation rule (Member's records deletable by Manager+, Manager's by Admin/Owner only); it evolved into a simpler and stricter model — Owner grants delete capability to named individuals, rather than it being implied by role at all. This is more flexible for the business (Owner decides trust on a person-by-person basis) and simpler to implement (one grant table, no per-role escalation logic to get subtly wrong).

**Explicitly deferred, not forgotten:** delegation grants are global-per-user in V1 (not scoped per domain/module) — e.g. no "can delete in Sales but not Inventory" yet. Straightforward to add to the same `UserDeletionGrant` table later; not built now because it wasn't asked for and would be speculative.

**Reversibility:** Medium. The grant table and audit log are additive and easy to extend (e.g., domain-scoped grants). Loosening the "no self-deletion" or "1/day" rules later is easy (config change); tightening them after users have grown used to looser behavior is the harder direction, as with any permission relaxation.

---

## 2026-07-18 — RBAC: fixed system roles for V1, not a custom role builder

**Decision:** V1 ships five fixed roles (Owner, Admin, Manager, Member, Viewer) with preset permission bundles. No per-org custom role creation or permission-matrix UI.

**Why chosen:** User confirmed simplicity over flexibility for V1 — a custom role builder is meaningful schema + UI work justified only once a real org needs non-standard roles, which isn't yet known.

**Consequences:** `Role` and `RolePermission` tables are still modeled as proper many-to-many from day one (not a hardcoded enum), specifically so V2 can add custom roles without a schema rewrite — only the role-*management* capability is deferred, not the data model.

**Reversibility:** High for adding the feature later (schema already supports it); low for removing fixed roles once orgs depend on them (standard migration risk, not special to this decision).

---

## 2026-07-18 — Architecture: modular monolith with DDD module boundaries

**Decision:** One NestJS application with isolated per-domain modules (Identity, CRM, Products, Inventory, Sales, Purchasing, Notifications, Settings), not microservices. Cross-domain reactions go through an in-process event emitter, never direct module-to-module calls outside the defined dependency graph.

**Why chosen:** At 50 orgs / 500 users, microservices add inter-service auth, network hops, and distributed-transaction complexity for no benefit, and would conflict with running the API as a single Vercel serverless function. Clean module boundaries keep the door open to extracting a domain into its own service later if a specific V2 need justifies it — at zero cost today.

**Reversibility:** Medium — module boundaries were designed to make future extraction possible, but it's not free; this is the default assumption for all of V1 and V2 unless a specific domain proves it needs independent scaling.

---

## 2026-07-18 — Design system: warm-stone neutrals + brand orange, muted-fill buttons

**Decision:** The visual palette is built around Mantra Sports' actual brand color (`#f05f22`, sampled from the logo) on a warm-stone neutral base, not a generic default. Primary buttons use a desaturated "muted/burnt" fill (`#C2703F`), not the raw brand hex.

**Context considered:** No companion palette existed beyond the single orange hex. Two full mockups were built and visually compared: Scheme A (warm stone + brand orange) vs. Scheme B (neutral zinc + indigo — the generic default originally proposed before the brand color was known). Within Scheme A, three primary-button treatments were tested side by side: full-saturation fill, muted/burnt fill, and outline.

**Why chosen:** User confirmed Scheme A preserves brand identity and was the preferred direction. Within it, the muted-fill button treatment was chosen deliberately over the raw brand hex — this is an internal tool used ~8 hours/day by staff, and full-saturation orange (`#F05F22` is a high-saturation hue in the "safety orange" family) repeating on every page as button fills was identified as a fatigue risk. The raw hex is preserved for small/infrequent elements (icons, active-nav indicator) where it reads as brand recognition rather than visual noise.

**Other adjustments made during this process:** Warning color shifted from standard amber to a more golden yellow (`#CA8A04`) to keep enough hue separation from the brand orange that status colors remain trustworthy at a glance. Any orange used as text/links uses a darkened shade (`#B23A0D`, 6:1 contrast) since the raw brand hex only reaches 3.3:1 on white and fails WCAG AA for text.

**Reversibility:** High — implemented as CSS/theme tokens (see [ARCHITECTURE.md](ARCHITECTURE.md)), not hardcoded values, so any future palette change is a token-level swap.

---

## 2026-07-18 — Hosting: 100% Vercel, NestJS as serverless functions

**Decision:** Both the Next.js frontend and the NestJS API deploy to Vercel. The API runs as Vercel serverless functions rather than on a persistent-container host.

**Context considered:** A persistent host (Railway/Fly/Render) would let NestJS keep its native strengths — in-process `@nestjs/schedule` cron, WebSocket gateways for real-time notifications, efficient pooled DB connections, room for long-running jobs (bulk import, future AI forecasting). Cost was ~$5–15/mo, negligible for the business.

**Why chosen anyway:** Avoids a second hosting bill and a second platform to operate; the team already trusts and uses Vercel elsewhere.

**Consequences to design around:**
- No in-process cron — scheduled work (recurring reports, inventory reconciliation) must go through **Vercel Cron** hitting protected API routes, not `@nestjs/schedule`.
- No native WebSocket gateway — V1 Notifications should ship as polling/on-demand fetch + Resend email, **not** real-time push. Defer a managed real-time vendor (Pusher/Ably) to V2 if a concrete need emerges — don't add it speculatively.
- Serverless execution time limits apply to any long-running work (bulk imports, report generation, future manufacturing/AI compute). Fine for V1 CRUD-heavy modules; V2 heavy jobs will likely need a queue (e.g. Inngest/QStash) — not needed now.
- Cold starts and high function concurrency mean Prisma **must** use Neon's pooled connection string (or Prisma Accelerate), never a direct connection, from Phase 3 onward.
- Note: commercial/production use of Vercel requires the paid Pro plan ($20/mo/seat) — the free Hobby tier is licensed for non-commercial use only.

**Reversibility:** Medium. The NestJS app itself stays portable (standard Nest app); only the deployment adapter and cron/realtime approach are Vercel-specific. Moving to a persistent host later is a deployment-layer change, not a rewrite.

---

## 2026-07-18 — Multi-tenancy: shared schema, `organization_id` + Postgres RLS

**Decision:** Single Postgres database, single schema. Every business table carries an `organization_id` foreign key. Tenant isolation is enforced twice: at the application layer (Prisma middleware auto-injects the org filter) and at the database layer (Postgres Row-Level Security) as defense-in-depth.

**Alternatives rejected:**
- *Schema-per-organization* — isolation benefit doesn't justify 50x migration/backup/connection overhead at this scale.
- *Database-per-organization* — same problem, worse; only justified by hard compliance/data-residency requirements, which no current or planned org has.

**Why chosen:** Standard pattern for multi-tenant SaaS at this scale (comparable to how Linear/Notion/Shopify-style platforms isolate tenants). Scales well past the 10M-row target with proper indexing on `organization_id`. Keeps cross-org operational tooling and reporting simple.

**Consequences to design around:**
- Every Prisma model needs `organizationId` and an index on it (usually as part of a composite index with other common filters).
- RLS policies must be written and tested per table before Phase 3 is considered done — this is the safety net against a cross-tenant data leak, which is a real incident given future orgs may be unrelated businesses.
- The NestJS request context needs a reliable, tamper-proof way to establish "current organization" per request (derived from the authenticated user's org membership, never from a client-supplied value alone).

**Reversibility:** Low. Changing tenancy model after data exists is a full migration. This is considered locked for V1 and V2.
