# Roadmap

## Phase status

| Phase | Status | Output |
|---|---|---|
| 1 — Design | ✅ Done | Navigation model, design system (locked palette) — [ARCHITECTURE.md](ARCHITECTURE.md) |
| 2 — Architecture | ✅ Done | DDD domain boundaries, monorepo layout, deployment topology, RLS mechanism, RBAC scope — [ARCHITECTURE.md](ARCHITECTURE.md), [DECISIONS.md](DECISIONS.md) |
| 3 — Database | ✅ Done | Prisma schema (30 models/9 domains), indexing, RLS policies — [DATABASE.md](DATABASE.md) |
| 4 — Backend | ✅ Done | All 9 modules built, live against real Neon + real auth. A critical RLS-interceptor wiring bug was found and fixed via Phase 5's e2e testing — see [DECISIONS.md](DECISIONS.md). |
| 5 — Frontend | ✅ Done | Next.js app shell, full auth flow, all V1 domains built (Customers set the pattern, 8 more followed it). End-to-end verified against the real API including live cross-domain flows. Three more real bugs found and fixed — see [DECISIONS.md](DECISIONS.md). |
| 6 — Testing | ✅ Done | Risk-based Vitest unit tests (DeletionGuardService, rolesFor, shipment/goods-receipt status math — 28 tests) + a new `verify-governance.js` integration script (rate limit, Viewer denial, cross-org isolation — 7 checks), alongside the existing `verify-*.js` scripts. All green together — see [ARCHITECTURE.md](ARCHITECTURE.md), [DECISIONS.md](DECISIONS.md). |
| 7 — Deployment | 🚧 In progress | Repo pushed to GitHub, prod JWT secret generated, `DEPLOYMENT.md` runbook written. Remaining: Neon prod project, two Vercel projects, live verification — see [TODO.md](TODO.md) and [DEPLOYMENT.md](DEPLOYMENT.md). |

## V1 scope (target)

Auth, Organizations, Users, Roles (fixed system roles), Permissions, Deletion governance (Owner-delegated grants), CRM, Products/Categories, Inventory/Warehouses, Sales, Purchasing, Marketing (email campaigns to CRM segments via Resend), Reports, Dashboard, Notifications, Settings.

## V2 (not started, not designed against yet)

Finance, Manufacturing, Marketplace Integrations, Mobile Apps, Advanced AI/Forecasting, custom RBAC role builder.

## Open items carried forward

See [TODO.md](TODO.md).
