# Architecture

This document grows with each phase. Covers Phase 1 (Design) and Phase 2 (Architecture) output.

## Navigation model

Persistent collapsible left sidebar (shadcn `Sidebar` + `SidebarProvider`) grouped by domain, plus a global `⌘K` command palette (shadcn `Command`) as the fast path to any record or action. This combination is what keeps 13+ V1 modules navigable within the 3-click budget without resorting to hidden/nested menus.

```
[Org switcher ▾]                                    ⌘K search    🔔  [avatar ▾]
─────────────────────────────────────────────────────────────────────────────
 Dashboard
 ─ CRM            Customers, Contacts
 ─ Catalog        Products, Categories
 ─ Inventory      Warehouses, Stock
 ─ Sales          Quotes, Sales Orders, Shipments
 ─ Purchasing     Suppliers, Purchase Orders
 ─ Marketing
 ─ Reports
 ─────────────────
 Settings
```

**Click budget:** sidebar item → list view (1) → record detail (2) → edit/action (3). `⌘K` provides a shorter path from anywhere in the app.

**Org switching:** always-visible top-left dropdown. Switching triggers a full context reload (never partial state), so there is no path for one organization's data to visually bleed into another's view — a UX-level reinforcement of the Postgres RLS isolation in [DECISIONS.md](DECISIONS.md).

## Design system — LOCKED 2026-07-18

Validated visually via two comparison mockups (warm-stone+orange vs. neutral-zinc+indigo) before locking. Warm-stone + brand orange chosen — see [DECISIONS.md](DECISIONS.md) for the full rationale.

**Neutrals (warm stone) + text:**

| Token | Light | Dark |
|---|---|---|
| Background | `#FAFAF9` | `#0C0A09` |
| Surface / card | `#FFFFFF`, border `#E7E5E4` | `#18140F`, border `#2C2620` |
| Surface (secondary, e.g. table header) | `#F5F5F4` | `#1F1A15` |
| Text primary | `#1C1917` | `#FAFAF9` |
| Text muted | `#78716C` | `#A8A29E` |
| Text faint | `#A8A29E` | `#78716C` |

**Brand accent (orange, sampled from the logo, `#f05f22`):**

| Token | Light | Dark | Use |
|---|---|---|---|
| Accent tint | `#FDE4D7` | `#3A2416` | subtle backgrounds, badges, active-nav fill |
| Accent base | `#F05F22` | `#F3763F` | icons, active-nav indicator/text — never a large fill |
| Accent hover | `#D6480F` | `#F58F5F` | hover state |
| **Primary button fill (locked)** | **`#C2703F`** | `#B4703F` | desaturated "muted/burnt" fill — chosen over the raw brand hex specifically because buttons repeat on every page all day; the full-saturation orange tested as visually fatiguing at that frequency |
| Primary button hover | `#A85A2E` | `#C78352` | |

**Semantic colors** (deliberately shifted off standard amber for Warning — a typical amber sits only ~15° from the brand orange on the color wheel, close enough to risk reading as "the same color" as brand/primary actions in a tool where status must be trusted at a glance):

| Token | Light | Dark |
|---|---|---|
| Success | `#16A34A` on `#DCFCE7` | `#4ADE80` on `#14251A` |
| Warning (pushed toward gold, away from brand hue) | `#CA8A04` on `#FEF3C7` | `#EAB308` on `#2A2410` |
| Destructive | `#DC2626` on `#FEE2E2` | `#F87171` on `#2A1616` |

- **Typography:** single family, **Inter**, for headings and body — varied by weight/size only. Minimum 16px body text.
- **Icons:** Lucide only, no emojis, consistent 20–24px sizing.
- **Density:** compact table rows (~36–40px) for data-dense views (Inventory, Sales Orders); headings/labels/primary content stay large per the readability requirement. Density is a table-level property, not an app-wide one.
- **Motion:** 150–300ms transitions, `prefers-reduced-motion` respected, skeleton loaders (not blank states) for async data.
- **Components:** built from shadcn primitives, not custom from scratch — `Sidebar`/`SidebarProvider` (nav), `Command` (search/palette), `Table` (data grids), `Sonner` (toasts). Scaffold dashboard shell from the `dashboard-01` block.
- **Page grammar:** every list page has Search + Filter + Export + Breadcrumb + top-right "New X" action, per the UI principles in [PROJECT.md](PROJECT.md). Detail pages use tabs for related data (e.g. Customer: Overview / Contacts / Orders / Activity).
- **Accessibility:** 4.5:1 minimum contrast, visible focus rings, full keyboard nav, `aria-label` on icon-only buttons. Note: raw brand orange `#F05F22` only hits 3.3:1 on white — it is never used for text/small elements, only icons, indicators, and large decorative moments; the darker `#B23A0D` shade is used wherever orange text/links are needed and passes AA at 6:1.

## Domain correction (Phase 1 → Phase 2)

The V1 module list in the brief nested *Sales Orders, Quotes, Shipments* under "Purchasing" alongside Suppliers. The brief's own DDD domain list separates **Sales** (outbound, to customers) from **Purchasing** (inbound, from suppliers) — these are opposite sides of the transaction and belong in separate NestJS modules / Prisma boundaries. The navigation above and all architecture below treats them as distinct domains: **Sales** (Quotes → Sales Orders → Shipments) and **Purchasing** (Suppliers → Purchase Orders).

---

# Phase 2 — Architecture

## Domain boundaries (DDD)

Dependency direction (arrows = "depends on"):

```
Identity  ← everything (Organization, User, Membership, Role, Permission)
   ↑
CRM, Products  (independent of each other)
   ↑              ↑
Inventory ────────┘   (needs Products + its own Warehouses)
   ↑
Sales  (needs CRM + Products + Inventory)
Purchasing  (needs Products + Inventory + its own Suppliers)
   ↑
Notifications  (listens to domain events from all of the above — never imported by them)
```

| Domain | Entities | Notes |
|---|---|---|
| **Identity** | Organization, User, Membership (user↔org, many-to-many), Role, Permission, RolePermission | Every other domain depends on this one; it depends on nothing. |
| **CRM** | Customer, Contact | |
| **Products** | Product, Category (self-referencing hierarchy) | |
| **Inventory** | Warehouse, StockLevel (product × warehouse), InventoryTransaction | InventoryTransaction is the 10M-row target table — see [DATABASE.md](DATABASE.md) for indexing once Phase 3 starts. |
| **Sales** | Quote, QuoteLine, SalesOrder, SalesOrderLine, Shipment, ShipmentLine | |
| **Purchasing** | Supplier, PurchaseOrder, PurchaseOrderLine, GoodsReceipt | GoodsReceipt feeds Inventory. |
| **Notifications** | Notification | Populated by listening to domain events, not by direct calls from other modules. |
| **Settings** | OrganizationSettings, UserPreferences | Deliberately thin. |
| **Marketing** | Segment, EmailTemplate, Campaign | Email-only for V1 — a Campaign sends an EmailTemplate to a saved Segment (a filter over CRM Customers/Contacts) via Resend, with delivery/open/click tracking via Resend webhooks. No landing pages, no social/ad channels — those would need vendors outside the current stack. |

**Reports and Dashboard are not domains.** They're read-only query layers aggregating across Sales/Inventory/CRM/etc. Giving them their own entities would duplicate data that already lives in the real domains.

**Domain events, not direct coupling:** cross-domain reactions (e.g. Notifications reacting to a new Sales Order) go through NestJS's in-process event emitter (`@nestjs/event-emitter`) — `SalesModule` emits `sales-order.created`, `NotificationsModule` listens. No domain module ever imports another domain's service directly except along the dependency arrows above. This is what keeps a modular monolith from turning into a tangled ball of mud as more modules are added. Because there's no persistent background worker (serverless), event listeners must complete their work synchronously within the request's execution window — fine for V1's lightweight writes (a Notification row, a Resend API call); a real queue is a V2 concern if listener work gets heavier.

## Modular monolith, not microservices

One NestJS app, one deployable unit, each domain as an isolated Nest module (own controller/service/repository/DTOs). At 50 orgs / 500 users, microservices would add inter-service auth, network calls, and distributed-transaction problems for zero benefit, and would conflict with running NestJS as a single Vercel serverless function ([DECISIONS.md](DECISIONS.md)). Because each domain module is already isolated, extracting one into its own service later stays possible if some V2 domain genuinely needs to scale independently — that costs nothing now, it's a consequence of clean module boundaries, not speculative design.

## RBAC scope — LOCKED 2026-07-18

V1 ships fixed system roles (Owner, Admin, Manager, Member, Viewer), each with a preset permission bundle from a static Permission catalog (`resource:action` pairs, e.g. `sales_orders:create`, `inventory:adjust`). No role-management UI, no custom role builder. `Role` and `RolePermission` tables exist so this can extend to per-org custom roles in V2 without a schema rewrite, but V1 does not expose that capability.

**Permission matrix (create/read/update — delete is handled separately below, it is not part of a role's base bundle):**

| Resource group | Owner | Admin | Manager | Member | Viewer |
|---|---|---|---|---|---|
| Organization & Billing | Full | Full | — | — | — |
| Users & Roles | Full | Full | — | — | — |
| Org Settings | Full | Full | Read | — | — |
| CRM / Products / Inventory / Sales / Purchasing / Marketing | Full (no delete) | Full (no delete) | Full (no delete) | Create + Edit | Read |
| Reports & Dashboard | Full | Full | Read + Export | Read + Export | Read |
| Notifications | own | own | own | own | own |

### Deletion governance — LOCKED 2026-07-18

Deletion is deliberately **not** a role-level permission. It's a separately governed capability, because accidental or malicious deletion in a system holding 1M+ customer records and 10M+ inventory transactions is a materially different risk than a bad edit.

- **Off by default for everyone except Owner.** The Owner can delegate delete capability to specific individual users by user ID (independent of that user's base role — a Member, a Manager, anyone), via a simple Owner-only toggle in Settings. Modeled as `UserDeletionGrant { organizationId, userId, grantedBy, grantedAt, revokedAt }` — Owner needs no row, the grant is implicit for them.
- **No one can delete a record they personally created** — this holds even for a user holding a delegated grant. The sole exception is the Owner, who is the floor of the escalation chain and may delete their own records (still logged, still rate-limited, still self-notified).
- Grants are **global per user for V1**, not scoped per domain (a grant means "can delete anywhere," not "can delete in Sales only"). Domain-scoped grants are a straightforward V2 extension of the same table if it turns out to be needed — not designed against speculatively now.
- Every deletion is a **soft delete** (`deletedAt`, per the project's DB principles) and writes an **audit log entry** (who deleted it, whose record it was, when) that surfaces in Reports — deletions are never silent.
- Every deletion emits a `record.deleted` domain event → Notifications sends an email to the Owner via Resend, using the same event pattern as everything else cross-domain.
- **Rate limit: 1 deletion per day per person performing the deletion** (Owner included), enforced at the service layer against the audit log.

## Monorepo layout

```
mantra-os/
├── apps/
│   ├── web/                Next.js (Vercel project 1)
│   └── api/                NestJS (Vercel project 2)
│       └── src/modules/{identity,crm,products,inventory,sales,purchasing,notifications,settings}/
│           ├── *.controller.ts
│           ├── *.service.ts
│           ├── *.repository.ts     ← wraps Prisma calls for aggregate roots
│           ├── *.events.ts          ← domain events this module emits
│           ├── dto/
│           └── *.module.ts
├── packages/
│   ├── db/                  Prisma schema, migrations, generated client
│   ├── shared-types/         DTOs/zod schemas shared web ↔ api
│   ├── ui/                   shared shadcn-based components
│   └── config/                shared eslint/tsconfig/tailwind config
└── turbo.json
```

Turborepo — simpler than Nx, first-class Vercel support.

## Deployment: two Vercel projects, one domain

`apps/web` and `apps/api` deploy as **separate Vercel projects** from the same repo (per-project root directory). NestJS bootstraps once per warm serverless instance — the Nest app instance is cached at module scope, not rebuilt per request — and is wrapped as a single function handling all routes, so cold start pays for one bootstrap, not one per endpoint.

`apps/web` proxies `/api/*` to the NestJS deployment via a Next.js rewrite, so end users only ever see one domain (no CORS) while the two apps stay independently deployable behind the scenes.

Cron jobs (per [DECISIONS.md](DECISIONS.md)) hit protected `/internal/cron/*` routes via Vercel Cron, authenticated with a shared secret header — never a public endpoint.

## Tenant context & RLS enforcement (request lifecycle) — implemented in Phase 4

The concrete mechanism behind the Phase 1 multi-tenancy decision. Note this differs slightly from the original Phase 2 sketch: NestJS runs all Guards before any Interceptor, so membership validation had to move into a Guard (not stay in the Interceptor) once a permission system needed the same data — see DECISIONS.md "Guard/interceptor split for tenant context".

1. `JwtAuthGuard` verifies our own self-issued JWT (see DECISIONS.md "Self-hosted authentication replaces Firebase"), attaches `req.user`.
2. `TenantMembershipGuard` reads the requested org (`X-Organization-Id` header) and **validates it against the user's actual Membership rows** — a client-supplied org id is never trusted on its own. Attaches `req.organizationId` and `req.membership` (role + permissions preloaded).
3. `PermissionGuard` (per-route, via `@RequirePermission('resource:action')`) checks the already-loaded `req.membership.role.rolePermissions` — no second query.
4. `TenantContextInterceptor` — registered globally as `APP_INTERCEPTOR` in `app.module.ts`, not per-controller — opens a single Prisma transaction for the rest of the request, issues `SET LOCAL app.current_org_id = '<uuid>'`, and makes that transaction reachable to every repository via `TenantContextService` (an `AsyncLocalStorage`-backed request context) rather than threading it through every function signature. RLS policies (Phase 3) check `current_setting('app.current_org_id')`. Controllers with no tenant context at all (e.g. `AuthController`) need class-level `@SkipTenantContext()` or this crashes on `req.user`/`req.organizationId` — see DECISIONS.md "Critical bug found: TenantContextInterceptor was never actually running" for what happens when a controller is missed.
5. Every domain repository extends `BaseRepository`, which exposes `this.db` — the ALS-scoped transaction client. Repositories that inject `PrismaService` directly instead would silently bypass RLS; this is the one pattern every domain module must follow.

The `SET LOCAL`-inside-a-transaction pattern specifically addresses pooled connections: with Neon's pooler, a session variable set outside a transaction can leak across requests reusing the same pooled connection. Scoping it to one transaction per request is the only reliable way to make RLS safe under serverless + connection pooling — a real constraint, not a style choice.

## Reference implementation (Phase 4) — all domains complete

`apps/api` now contains a real, compiling, boot-verified NestJS app covering every V1 domain:

- `src/common/` — guards (`JwtAuthGuard`, `TenantMembershipGuard`, `PermissionGuard`), `TenantContextInterceptor`, `TenantContextService` (ALS), `DeletionGuardService` (with a `deleteWithGovernance()` convenience wrapper every domain service uses), `BaseRepository`, global exception filter, and `permissions/permission-keys.ts` — the single source of truth for every `@RequirePermission()` key, shared with `packages/db/scripts/seed-rbac.js`.
- `src/modules/auth/` — login, forgot-password, reset-password. Self-hosted (bcrypt + JWT), no third-party identity vendor — see DECISIONS.md.
- `src/modules/identity/` — Organizations, Memberships, DeletionGrants, Roles.
- `src/modules/notifications/` — the `record.deleted` event listener + Resend wrapper (also reused by Marketing's campaign sends).
- `src/modules/crm/` — Customers, Contacts. First domain to exercise `DeletionGuardService` on a real business record.
- `src/modules/products/` — Products, Categories.
- `src/modules/inventory/` — Warehouses, plus `InventoryService.recordMovement()` — the one place `InventoryTransaction` + `StockLevel` are written together, called directly (not via events) by Sales and Purchasing per the DDD dependency graph.
- `src/modules/sales/` — Quotes, SalesOrders, Shipments. Shipment creation calls `InventoryService.recordMovement()` (type `SHIPMENT`, negative delta) and recomputes the parent SalesOrder's status (`SHIPPED`/`PARTIALLY_SHIPPED`) from cumulative shipped-vs-ordered quantity per line.
- `src/modules/purchasing/` — Suppliers, PurchaseOrders, GoodsReceipt (+ the `GoodsReceiptLine` table added mid-implementation, see DECISIONS.md). Mirrors Shipments in reverse: receiving calls `recordMovement()` with type `RECEIPT` and a positive delta.
- `src/modules/marketing/` — Segments (a deliberately minimal filter DSL — see `segment-filter.dto.ts`), EmailTemplates, Campaigns (`POST /v1/campaigns/:id/send` resolves the segment's recipients and sends via the same `ResendService` Notifications uses).
- `src/modules/reports/` — one dashboard-summary endpoint aggregating across CRM/Sales/Inventory. No entities of its own, per the "Reports and Dashboard are not domains" note above.
- `api/index.ts` — the Vercel serverless handler, Nest app cached at module scope per the deployment section above.

**Live since 2026-07-19** against the real Neon project (see DATABASE.md). Login was driven end-to-end over real HTTP at the time: wrong password → 401, correct password → a real signed token, that token against a protected route → 200, no token → 401. All ten domain modules wired, zero DI errors — **but this was DI-wiring and route-mapping verification, not proof the RLS transaction mechanism itself was active.** It wasn't — see DECISIONS.md "Critical bug found: TenantContextInterceptor was never actually running", caught and fixed once Phase 5's frontend made a genuine end-to-end request possible.

**Explicitly out of scope for V1**, noted rather than silently skipped: user invite/onboarding flow (Identity assumes a User row already exists — now also needs an initial password set, not just a Firebase account created), a real Segment query DSL beyond one filter field, and Campaign send batching/rate-limiting beyond what Resend itself provides.

## Phase 5 — Frontend

`apps/web` (Next.js 14, App Router) implements the Phase 1 design system and navigation model against the real API — not a mockup this time, the actual `apps/api`.

**Design system wiring:** `app/globals.css` defines the locked palette (ARCHITECTURE.md "Design system") as raw-hex CSS custom properties — light in `:root`, dark under `prefers-color-scheme: dark` — mapped into `tailwind.config.ts` as semantic color names (`background`, `accent`, `primary`, `success`, etc.). `components/ui/` are hand-written shadcn-style primitives (Button, Input, Table, Command, Dialog, Tabs, ...) built on the same Radix + cva + tailwind-merge pattern shadcn's CLI generates, rather than running the CLI against a registry — equivalent output, no registry dependency.

**Session model:** no Auth.js-style client session helper (see DECISIONS.md "Self-hosted authentication replaces Firebase" for why). The JWT lives in an **httpOnly cookie** (`lib/session.ts`), set only by `app/api/auth/login/route.ts` — never readable by client JS. Two paths reach the API: Server Components call `lib/api.ts`'s `apiFetch()` directly (reads the cookie server-side); client components go through `app/api/v1/[...path]/route.ts`, a catch-all proxy that attaches `Authorization` and `X-Organization-Id` from the httpOnly cookies before forwarding. `middleware.ts` redirects unauthenticated requests to `/login` and un-org-selected ones to `/orgs`.

**App shell:** `components/layout/` — `Sidebar` (grouped nav matching the Phase 1 mockup), `OrgSwitcher` (full page reload on switch, never a client transition — data from the old org must never linger on screen), `Topbar`, `NotificationsBell`, `CommandPalette` (⌘K, decoupled from the topbar's search pill via a small custom DOM event rather than shared state/context), `Breadcrumb` (auto-derived from the URL against nav config — pages never hand-author their own).

**Customers was the one full vertical slice built first** (list with debounced search + type filter + client-side CSV export + breadcrumb, detail with Overview/Contacts tabs, create form, delete wired to the real `DeletionGuardService` governance — the button surfaces whatever reason the API gives, it doesn't reimplement the rule). It set the pattern; every other domain followed it.

**All V1 domains are now built**, no `ComingSoon` placeholders left: Products/Categories, Warehouses/Inventory (stock levels + transaction ledger + manual adjustment), Contacts, Sales (Quotes/SalesOrders/Shipments, sharing a `LineItemsEditor` component), Purchasing (Suppliers/PurchaseOrders/GoodsReceipts, mirroring Sales), Marketing (Segments/EmailTemplates/Campaigns, tabbed under one nav item), Settings (org info/Members/Deletion Access, tabbed, gracefully hiding Owner/Admin-only tabs on 403 rather than erroring), and Reports. Simple reference-data domains (Categories, Warehouses, Suppliers) skip a dedicated detail page by design — list + create + delete is the right amount of UI for data with no meaningful sub-structure to drill into. `components/domain/` holds the patterns reused across all of them: `SearchInput`, `DeleteEntityButton`, `ExportCsvButton`, `LineItemsEditor`.

**Verified with a real, repeatable end-to-end script** (`packages/db/scripts/verify-frontend-e2e.js`) — not manual clicking: creates a real org/user/membership, then drives the actual running Next.js app (proxying to the actual running NestJS API) over HTTP with real cookies through the full flow. Covers both the auth/CRUD path (login, org picker, org selection, dashboard with real KPI data, customer create/view/delete with Owner-escalation-floor deletion firing for real, no-session redirect) and the one piece of genuine cross-domain business logic in the new work: Supplier → PurchaseOrder → GoodsReceipt → Inventory (stock level checked at 20 after receiving 20) and Customer → SalesOrder → Shipment → Inventory (stock checked at 12 after shipping 8 of 20, SalesOrder status auto-transitioning to `SHIPPED`). This exact script is what caught the `TenantContextInterceptor` bug above and three more in finishing the remaining domains — see DECISIONS.md "Three more real bugs found completing Phase 5's remaining 8 domains".

## API conventions

REST, `/v1/` prefix, NestJS DTOs + class-validator for input validation, one global exception filter for a consistent error shape, Swagger auto-generated as the source for [API.md](API.md) rather than hand-maintained.

## Phase 6 — Testing

Two layers, deliberately kept separate rather than unified into one framework — see DECISIONS.md "Phase 6 testing scope: risk-based, not exhaustive-per-endpoint" for the full reasoning.

**Unit layer — Vitest, `apps/api`** (`vitest.config.ts`, `src/**/*.spec.ts`, run via `npm test` in `apps/api`). Scoped to pure/near-pure logic where a bug would be silent and wide-reaching rather than to every CRUD path:
- `common/deletion/deletion-guard.service.spec.ts` — mocks `TenantContextService` and `EventEmitter2` directly (not the real `AsyncLocalStorage`, which the `verify-*.js` scripts already exercise for real) to isolate `DeletionGuardService`'s own authorization rules.
- `common/permissions/roles-for.ts` + `.spec.ts` — `rolesFor()` extracted out of `seed-rbac.js`'s inline logic so it's independently testable; the seed script now imports it back from compiled `dist`, the same pattern already used for `PERMISSIONS`.
- `modules/sales/shipments/shipment-status.util.ts` + `modules/purchasing/goods-receipts/goods-receipt-status.util.ts` (+ specs) — the order-line-quantity-vs-fulfilled math pulled out of `ShipmentsService`/`GoodsReceiptsService` into pure functions so status-transition edge cases (partial, full, over-fulfillment, never-regresses) can be pinned down without a live server per case.

**Integration/e2e layer — `packages/db/scripts/verify-*.js`**, unchanged in approach from Phase 5: real servers, real HTTP, real cookies, real Neon DB, cleans up after itself.
- `verify-frontend-e2e.js` (19 checks) — the full auth/CRUD/cross-domain-business-logic path, unchanged from Phase 5.
- `verify-governance.js` (new, 7 checks) — the governance rules that weren't previously exercised over HTTP: the 1/day deletion rate limit actually blocking a second delete (even for the Owner), a Viewer-role user reading successfully but getting 403 on write, and cross-org isolation (a second org's Owner gets 404 fetching another org's customer by ID, and it's absent from their list).
- `verify-rls.js`, `verify-auth.js` — unchanged from Phases 3–4, still part of the suite.

All five together (28 unit tests + 19 + 7 + the two lower-level scripts) passed clean on the first full run after this phase's changes.
