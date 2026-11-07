# Architecture Decisions

## 2026-11-07: Initial scaffold

- Use Next.js App Router, TypeScript, and Tailwind CSS as requested. The app is scaffolded with the current stable Next.js release verified from npm (`16.4.5`).
- Use npm because pnpm is not installed in the environment.
- Keep the initial deployment shell minimal. Persistence, authentication, billing, and provider integrations will be introduced in later phases behind explicit adapters.
- Use Vitest and fast-check for unit and property tests. The scaffold's Node type definitions are aligned to Node 24 to satisfy current Vitest peer requirements.
- The repository directory is capitalized, which create-next-app rejects as an npm package name. The generator was run in a lowercase temporary directory and its app files were copied into the existing repository root, preserving `.git` and the existing README content.
- This phase has not provisioned a database or deployed the app. Vercel CLI is not currently installed; account authentication and project linkage remain to be checked before deployment.