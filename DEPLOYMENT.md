# Deployment — Phase 7

Two independently-deployed Vercel projects from the same GitHub repo ([github.com/deepakchanana15/mantra-os](https://github.com/deepakchanana15/mantra-os)), per the hosting decision in [DECISIONS.md](DECISIONS.md). Most steps here require your Vercel/Neon accounts directly — this is a runbook, not something that can be scripted end-to-end without your credentials.

## Phase 7 decisions (see DECISIONS.md for full rationale)

- **Vercel Hobby plan, accepted as a known risk.** Production/commercial use technically requires Pro ($20/mo/seat) per Vercel's ToS; you've chosen to launch on Hobby anyway. Revisit if Vercel enforces this or before it matters to the business.
- **Fresh Neon project for production**, separate from the dev/test project used through Phases 3–6 (which keeps all the demo/test-script data as a scratch DB).
- **Email provider deferred at launch, since switched to Brevo (dev only so far).** Shipped with a placeholder API key — password reset and deletion-governance owner-notification emails silently failed (the request itself still succeeded; only the email send failed). See DECISIONS.md "Switched email provider to Brevo" — still needs real prod env vars and a verified sending domain before this is solid for real users.
- **Custom domain deferred.** Both projects launch on their default `*.vercel.app` subdomains. Add a custom domain later whenever you're ready — it's a Vercel dashboard setting, not a code change.

## Step 1 — Provision the production Neon database

1. In the [Neon console](https://console.neon.tech), create a new project (e.g. `mantra-os-prod`), same region as your dev project.
2. Copy the **pooled** connection string (the one with `-pooler` in the hostname) — this is what both `DATABASE_URL` values below use. Serverless + connection pooling requires the pooled string; a direct connection string will exhaust Postgres connections under concurrent invocations (see ARCHITECTURE.md "Tenant context & RLS enforcement").
3. From your machine, with `DATABASE_URL` in `packages/db/.env` temporarily pointed at the **new** prod connection string:
   ```
   npm run db:generate
   cd packages/db && npx prisma migrate deploy
   ```
4. Re-run the two one-off setup scripts against prod (same pattern as when the dev database was first provisioned):
   ```
   node packages/db/scripts/setup-app-role.js
   node packages/db/scripts/seed-rbac.js
   ```
5. Do **not** run `create-demo-user.js` against prod unless you actually want that demo account live in production.
6. Restore `packages/db/.env` back to the dev connection string afterward so local development keeps using the dev database.

## Step 2 — Vercel project for `apps/api`

1. In the Vercel dashboard: **Add New → Project**, import `deepakchanana15/mantra-os`.
2. **Root Directory:** `apps/api`. Framework preset: Other (it's a custom serverless handler via `apps/api/vercel.json`, not a Vercel-detected framework).
3. **Build command:** `npm run build` (runs `nest build` — but note this is an npm workspace, so Vercel needs "Install Command" left at default so it installs from the repo root, not just `apps/api`).
4. Environment variables (Production):
   - `DATABASE_URL` — the prod Neon pooled connection string from Step 1.
   - `AUTH_JWT_SECRET` — a real per-environment secret. One was generated for you locally rather than posted in chat: see the file path shared separately. Never reuse the dev secret.
   - `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `BREVO_WEBHOOK_SECRET` — switched from Resend to Brevo, see DECISIONS.md "Switched email provider to Brevo". Not yet set in prod as of that entry — dev only so far. Once set, run `packages/db/scripts/register-brevo-webhook.js` against this project's deployed URL to wire up the webhook.
5. Deploy. Note the resulting URL (`https://<something>.vercel.app`) — this is `apps/api`'s production URL, needed in Step 3.
6. Sanity check once deployed:
   ```
   curl -X POST https://<your-api-project>.vercel.app/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"x\",\"password\":\"y\"}"
   ```
   Expect `401` (real validation running), not a 500 or a timeout.

## Step 3 — Vercel project for `apps/web`

1. **Add New → Project** again, same repo, **Root Directory:** `apps/web`. Framework preset: Next.js (auto-detected).
2. Environment variables (Production):
   - `API_BASE_URL` — the `apps/api` project's URL from Step 2 (no trailing slash).
3. Deploy. This is the URL your users will actually visit.
4. Sanity check: visit `/login` on the deployed URL and confirm the page renders (styling, form) before testing an actual login.

## Step 4 — Verify the live deployment end-to-end

Once both are up, the fastest real check is the same one used throughout Phases 4–6: log in as a real user and click through a full flow (create a customer, a product, a warehouse, a purchase order → goods receipt, a sales order → shipment) rather than trusting "it deployed" alone. If you want a seeded account to start from, re-run `create-demo-user.js` against the prod database (Step 1's connection string) the same way it was run for local testing.

## Known gaps carried into Phase 7 (see TODO.md for the full list)

- No CI pipeline yet — deploys happen on push to `main` via Vercel's own Git integration, but nothing runs the Vitest/verify-*.js suite automatically before that. Worth adding before this repo has more than one contributor.
- User invite/onboarding flow still doesn't exist — every account (including the demo one) is created directly against the database, not through the product itself.
- Brevo's production env vars/webhook registration and the custom domain, as noted above.
