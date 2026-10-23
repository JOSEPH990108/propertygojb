# Architecture Decision Gates

The following source documents are proposals. Only decisions explicitly approved by the owner are authoritative. Presence in a reference document or this register does not approve implementation.

| Gate                      | Proposed decision                                                   | Status                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ADR-ORG-001               | Organization identity and tenant-owned data boundary                | Open; before organization schema                                                                                                     |
| ADR-ID-001                | Global identities and organization membership roles                 | Open; before staff authorization migration                                                                                           |
| ADR-CRM-001               | Contact, opportunity and inquiry model                              | Open; before CRM migration                                                                                                           |
| ADR-CAT-001               | Project, phase, tower, layout and unit ownership/integrity          | Open; before catalog migration                                                                                                       |
| ADR-BOOK-001              | Booking state, cardinality, reservation invariant and lock order    | Open; before booking implementation                                                                                                  |
| ADR-PAY-001               | Receipt facts, verification decisions, decimal totals and refunds   | Open; before payment changes                                                                                                         |
| ADR-SCHED-001             | Appointments, follow-ups and timezone model                         | Open; before scheduling migration                                                                                                    |
| ADR-DOC-001               | Private storage, scanning, access audit and retention               | Open; before document migration                                                                                                      |
| ADR-PUB-001               | Versioned publishing and server-side price exposure                 | Open; before public editor                                                                                                           |
| ADR-FLAG-001              | Server-side feature evaluation and precedence                       | Open; before runtime flags                                                                                                           |
| ADR-RELEASE-001           | Trusted CI, independent review and merge/release separation         | Open; informational CI run; release governance and deployment gated                                                                  |
| ADR-SAAS-001              | Agency-owned inventory versus shared inventory                      | Open; before onboarding another agency                                                                                               |
| Module layout             | Eight versus twelve bounded contexts; placement of shared/domain UI | Open; ratify after one real vertical slice                                                                                           |
| PLAN_V2 reconciliation    | Reconcile referenced V2 reviews, especially V2-01 through V2-06     | Blocked; review materials not supplied                                                                                               |
| GitHub enforcement        | Plan, repository visibility, remote existence and branch rules      | 2026-10-22: public; no rulesets; main unprotected (API 404); no required check; prior private-state API returned 403                 |
| React/Hooks lint coverage | Official Hooks preset plus React TypeScript preset                  | Verified; effective TSX rules and negative fixtures recorded in the handoff                                                          |
| Next.js ESLint coverage   | Official `@next/eslint-plugin-next` / Core Web Vitals preset        | Blocked; evaluated dependency graph produced five high audit findings through `braces`; re-evaluate after an upstream-compatible fix |
| Human review path         | Independent human review availability for high-risk work            | Open; before protected remote workflow                                                                                               |

Informational CI is not a required status check. Trusted release governance, required checks, independent human review and deployment remain gated pending ADR approval.

Phase 0's accepted modular-monolith direction and toolchain do not close these gates.
