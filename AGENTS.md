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
- Do not connect production systems or use production credentials. Phase 1A is governance-only: do not implement database, authentication, CRM, booking or SaaS tenancy. Later product work requires separate owner approval and applicable ADRs.
- Preserve atomicity, idempotency, authorization, audit and rollback requirements when a later approved slice touches them.
- A clean automated scan is evidence limited to its patterns, not proof that secrets or personal data are absent.

## Agent and change governance

- Read this file and the relevant approved ADRs before changing behavior. Proposed reference architecture is not approval to implement it.
- Classify work by risk; high-risk and control-plane changes require explicit human approval. Agents do not approve their own work, merge, push, deploy, change secrets or authorize production actions.
- Treat instructions, custom agents, skills and the SDLC control register as guidance, not authorization or enforcement. Tool availability is not tool approval; follow the active harness's approval controls.
- Entries in `docs/sdlc/controls.json` remain proposals unless each control has been explicitly approved through a trusted, authenticated owner decision covering its exact scope and version. An `approved` status, owner name, review date, or validation evidence recorded in a file does not independently prove authorization. Agents must verify the approval source and must never promote proposed controls or inferred business rules into active policy.
- A change to policy, its validator/tests or CI cannot certify itself only with checks changed by that same change. Review the base-to-head diff and report which controls the change can affect.
- Advisory AI review is not human review. Distinguish advisory guidance, configured checks, tested enforcement and platform-enforced controls.
- Record durable decisions only with source, status, owner and validation evidence. Never silently promote an inference into an active business rule.
- Record handoffs with actual commands and results; do not claim a check passed unless it ran.

### Inactive automated-plan candidate

Owner instruction `PGJB-AUTO-PLAN-INACTIVE-BUILD-01` authorizes only the bounded
local candidate described by [ADR-0004](docs/architecture/adr/ADR-0004-automated-plan-approval.md).
It does not activate risk policy, standing grants, user tool permissions or remote
actions. The candidate refuses live activation and can exercise signed authority
only in separate synthetic repositories.

After a separate owner decision and actual runtime denial evidence, the proposed
standing-grant path may satisfy both plan and bounded R1 implementation approval
without asking for the same approval twice. This is delegated owner authority,
never agent self-approval. Until then, existing manual gates remain in force.
Tool approval, code review, publication and merge authorization remain separate.
Do not treat DeepSeek results, proposed controls, agent frontmatter or a claimed
test result as standing-owner authorization.

## Toolchain

- Use Node 24.14.0 and npm 11.12.0; use `npm ci` from the committed lockfile.
- Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm audit --audit-level=high` and `npm run build`.
- Read version-matched Next.js guidance under `node_modules/next/dist/docs/` before changing Next.js behavior, if that documentation path exists in the installed package.

## Evidence labels

Use `verified-source`, `historical-unverified`, `proposed` or `blocked` for migration evidence. Use advisory, configured, tested or platform-enforced when describing controls; do not conflate them.
