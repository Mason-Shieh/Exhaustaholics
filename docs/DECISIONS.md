# Architecture Decisions

## 2026-11-07: Initial scaffold

- Use Next.js App Router, TypeScript, and Tailwind CSS as requested. The app is scaffolded with the current stable Next.js release verified from npm (`16.4.5`).
- Use npm because pnpm is not installed in the environment.
- Keep the initial deployment shell minimal. Persistence, authentication, billing, and provider integrations will be introduced in later phases behind explicit adapters.
- Use Vitest and fast-check for unit and property tests. The scaffold's Node type definitions are aligned to Node 24 to satisfy current Vitest peer requirements.
- The repository directory is capitalized, which create-next-app rejects as an npm package name. The generator was run in a lowercase temporary directory and its app files were copied into the existing repository root, preserving `.git` and the existing README content.
- Phase 1 deployed the demo shell to Vercel. Vercel CLI deployments work, but the Vercel GitHub App still needs repository authorization for push and PR auto-deploys.

## 2026-11-07: Tenant data foundation

- Use Drizzle ORM with PostgreSQL and the `postgres` driver. The schema is generated from typed definitions, with migrations kept in `lib/db/migrations/`.
- Keep `DATABASE_URL` optional so the sample app works without credentials. Database access is created lazily and is only available from server-only modules.
- Use transaction-local `app.shop_id` and `app.owner_id` settings for PostgreSQL RLS. DAL queries also include explicit scope predicates; RLS is defense in depth, not a replacement for the central role policy.
- Approved design revisions, approvals, and status events are immutable in PostgreSQL. Revisions after approval require a new row and revision number.
- Vehicle envelopes are generic class templates and are marked sample/parametric. Their dimensions are not verified vehicle specifications and must not be presented as precise fitment data.
- Sample catalog and price book values are illustrative only. No material price or density is a shop quote until that shop configures and verifies its own inputs.