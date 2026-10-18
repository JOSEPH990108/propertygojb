# PropertyGOJB Engineering Rules

## Project boundaries

- Keep one repository and one Next.js modular monolith initially, with public/customer, agent and admin surfaces.
- Use `src/modules/<domain>/` for domain code when a real vertical slice is approved. Do not create empty modules or copy the legacy repository wholesale.
- Keep routes as composition and transport boundaries. Put business behavior behind domain-owned application interfaces.
- Keep reusable component styling, behavior, feature visibility and permissions as separate concerns. UI visibility never grants authorization.
- Enforce authorization and ownership on the server at every protected mutation boundary.
- Treat the single-company organization context and all detailed tenancy/ERD choices as proposals unless an owner-approved ADR says otherwise. Never trust a client-supplied organization identifier.

## Data and security

- Use synthetic or redacted data only. Never place credentials, customer data, OTPs or private documents in prompts, fixtures, logs or evidence.
- Do not connect production systems or use production credentials. Do not implement database, authentication, CRM, booking or SaaS tenancy during Phase 0.
- Preserve atomicity, idempotency, authorization, audit and rollback requirements when a later approved slice touches them.
- A clean automated scan is evidence limited to its patterns, not proof that secrets or personal data are absent.

## Agent and change governance

- Read this file and the relevant approved ADRs before changing behavior. Proposed reference architecture is not approval to implement it.
- Classify work by risk; high-risk and control-plane changes require explicit human approval. Agents do not approve their own work, merge, push, deploy, change secrets or authorize production actions.
- Advisory AI review is not human review. Distinguish advisory guidance, configured checks, tested enforcement and platform-enforced controls.
- Record durable decisions only with source, status, owner and validation evidence. Never silently promote an inference into an active business rule.
- Record handoffs with actual commands and results; do not claim a check passed unless it ran.

## Toolchain

- Use Node 24.14.0 and npm 11.12.0; use `npm ci` from the committed lockfile.
- Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm audit --audit-level=high` and `npm run build`.
- Read version-matched Next.js guidance under `node_modules/next/dist/docs/` before changing Next.js behavior, if that documentation path exists in the installed package.

## Evidence labels

Use `verified-source`, `historical-unverified`, `proposed` or `blocked` for migration evidence. Use advisory, configured, tested or platform-enforced when describing controls; do not conflate them.
