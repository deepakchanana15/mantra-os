# MantraOS

A cloud-first, multi-organization Business Operating System. Initially runs Mantra Sports; the architecture supports unrelated future organizations from day one.

## Design philosophy

Feel like Shopify Admin / Stripe Dashboard / Linear / Notion. Not like SAP / Oracle / Dynamics.

Clean UI, large readable fonts, no hidden menus, max 3 clicks to any feature, responsive, fast, keyboard shortcuts, global search, consistent layouts.

## Technology stack

| Layer | Choice |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS (deployed as Vercel serverless functions) |
| Database | PostgreSQL on Neon |
| ORM | Prisma |
| Authentication | Self-hosted — bcrypt + signed JWT, own Postgres `users` table (originally Firebase Auth; replaced — see [DECISIONS.md](DECISIONS.md)) |
| Hosting | Vercel (frontend + API) |
| Storage | Cloudflare R2 |
| Email | Resend |
| VCS | GitHub |
| Payments (future) | Stripe, PayPal |

## Scale targets (must not require architectural redesign)

50 organizations · 500 users · 50 warehouses · 1M customers · 10M inventory transactions.

## V1 modules

Auth, Organizations, Users, Roles, Permissions, CRM (Customers/Contacts), Products/Categories, Inventory/Warehouses, Sales (Quotes/Sales Orders/Shipments), Purchasing (Suppliers/Purchase Orders), Marketing, Reports, Dashboard, Notifications, Settings.

Note: Sales and Purchasing are modeled as separate domains (see [ARCHITECTURE.md](ARCHITECTURE.md#domain-correction-feeds-phase-2)) — outbound-to-customer vs inbound-from-supplier are distinct DDD boundaries even though the original brief nested them together.

## V2 modules

Finance, Manufacturing, Marketplace Integrations, Mobile Apps, Advanced AI/Forecasting.

## Process

Built phase-gated: Design → Architecture → Database → Backend → Frontend → Testing → Deployment. See [DECISIONS.md](DECISIONS.md) for locked architectural decisions, [ROADMAP.md](ROADMAP.md) for phase status, [ARCHITECTURE.md](ARCHITECTURE.md) for system design, [DATABASE.md](DATABASE.md) for the schema.

**Current phase: 6 — Testing (complete). Risk-based Vitest unit tests plus a new `verify-governance.js` integration script cover deletion governance, RBAC, status-transition math, and cross-org isolation, alongside the existing `verify-*.js` scripts — all green together. Ready for Phase 7 — Deployment.**
