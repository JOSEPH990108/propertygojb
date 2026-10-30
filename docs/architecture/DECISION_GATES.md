# Architecture Decision Gates

The following source documents are proposals. Only decisions explicitly approved by the owner are authoritative. Presence in a reference document or this register does not approve implementation.

| Gate                      | Proposed decision                                                   | Status                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-ORG-001               | Organization identity and tenant-owned data boundary                | Open; before organization schema                                                                                                         |
| ADR-ID-001                | Global identities and organization membership roles                 | Open; before staff authorization migration                                                                                               |
| ADR-CRM-001               | Contact, opportunity and inquiry model                              | Open; before CRM migration                                                                                                               |
| ADR-CAT-001               | Project, phase, tower, layout and unit ownership/integrity          | Open; before catalog migration                                                                                                           |
| ADR-BOOK-001              | Booking state, cardinality, reservation invariant and lock order    | Open; before booking implementation                                                                                                      |
| ADR-PAY-001               | Receipt facts, verification decisions, decimal totals and refunds   | Open; before payment changes                                                                                                             |
| ADR-SCHED-001             | Appointments, follow-ups and timezone model                         | Open; before scheduling migration                                                                                                        |
| ADR-DOC-001               | Private storage, scanning, access audit and retention               | Open; before document migration                                                                                                          |
| ADR-PUB-001               | Versioned publishing and server-side price exposure                 | Open; before public editor                                                                                                               |
| ADR-FLAG-001              | Server-side feature evaluation and precedence                       | Open; before runtime flags                                                                                                               |
| ADR-RELEASE-001           | Trusted CI, independent review and merge/release separation         | Open; informational CI run; release governance and deployment gated                                                                      |
| ADR-SAAS-001              | Agency-owned inventory versus shared inventory                      | Open; before onboarding another agency                                                                                                   |
| Module layout             | Eight versus twelve bounded contexts; placement of shared/domain UI | Open; ratify after one real vertical slice                                                                                               |
| PLAN_V2 reconciliation    | Reconcile referenced V2 reviews, especially V2-01 through V2-06     | Blocked; review materials not supplied                                                                                                   |
| GitHub enforcement        | Plan, repository visibility, remote existence and branch rules      | 2026-10-22: public; no rulesets; main unprotected (API 404); no required check; prior private-state API returned 403                     |
| React/Hooks lint coverage | Official Hooks preset plus React TypeScript preset                  | Verified; effective TSX rules and negative fixtures recorded in the handoff                                                              |
| Next.js ESLint coverage   | Official `@next/eslint-plugin-next` / Core Web Vitals preset        | Blocked; evaluated dependency graph produced five high audit findings through `braces`; re-evaluate after an upstream-compatible fix     |
| Human review path         | Independent human review availability for high-risk work            | Open; before protected remote workflow                                                                                                   |
| ADR-0004                  | Inactive automated-plan MVP and signed standing-owner authority     | Revision 2 accepted for local build only by PGJB-AUTO-PLAN-INACTIVE-BUILD-01; live activation and actual harness denial evidence blocked |

Informational CI is not a required status check. Trusted release governance, required checks, independent human review and deployment remain gated pending ADR approval.

Phase 0's accepted modular-monolith direction and toolchain do not close these gates.

## Inactive SDK runner increment

Owner instructions `PGJB-AUTO-PLAN-TASK-RUNNER-INACTIVE-01` and
`PGJB-AUTO-PLAN-SDK-DEPENDENCY-REPAIR-01` authorize local implementation/testing
of the standalone SDK runner and the exact SDK-scoped Zod repair. They do not
activate ADR-0004's proposed standing authority or close the existing gates.

The reference harness is the public Copilot SDK, not native VS Code chat.
Runtime tool denial, model-driven continuation, dependency provenance and
independent human review are separate evidence requirements. A skipped model
test, source configuration or green advisory scan cannot substitute for them.
Model-account authentication is also separate from plan approval; unavailable
authentication blocks the model test rather than relaxing the tool profile.

First real R1 admission still requires separately authorized runtime/source
installation, signer/grant enrollment, exact baseline/paths, expiry/revocation,
audit retention/recovery and removal of the compiled live block through a
reviewed change. R2/R3/R4, secrets, identity, migrations, payments, GitHub
governance, publication, deployments and merges remain outside this increment.
