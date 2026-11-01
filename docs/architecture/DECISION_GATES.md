# Architecture Decision Gates

The following source documents are proposals. Only decisions explicitly approved by the owner are authoritative. Presence in a reference document or this register does not approve implementation.

| Gate                      | Proposed decision                                                   | Status                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ADR-ORG-001               | Organization identity and tenant-owned data boundary                | ADR-0005: minimal organization identity approved and PostgreSQL-tested locally for D1; independent review/integration and SaaS remain open |
| ADR-ID-001                | Global identities and organization membership roles                 | Open; before staff authorization migration                                                                                                 |
| ADR-CRM-001               | Contact, opportunity and inquiry model                              | Open; before CRM migration                                                                                                                 |
| ADR-CAT-001               | Project, phase, tower, layout and unit ownership/integrity          | Open; before catalog migration                                                                                                             |
| ADR-BOOK-001              | Booking state, cardinality, reservation invariant and lock order    | Open; before booking implementation                                                                                                        |
| ADR-PAY-001               | Receipt facts, verification decisions, decimal totals and refunds   | Open; before payment changes                                                                                                               |
| ADR-SCHED-001             | Appointments, follow-ups and timezone model                         | Open; before scheduling migration                                                                                                          |
| ADR-DOC-001               | Private storage, scanning, access audit and retention               | Open; before document migration                                                                                                            |
| ADR-PUB-001               | Versioned publishing and server-side price exposure                 | Open; before public editor                                                                                                                 |
| ADR-FLAG-001              | Server-side feature evaluation and precedence                       | Open; before runtime flags                                                                                                                 |
| ADR-RELEASE-001           | Trusted CI, independent review and merge/release separation         | Open; Validate is now required by an active ruleset; independent human review, release authority and deployment remain gated               |
| ADR-SAAS-001              | Agency-owned inventory versus shared inventory                      | Open; before onboarding another agency                                                                                                     |
| Module layout             | Eight versus twelve bounded contexts; placement of shared/domain UI | Open; ratify after one real vertical slice                                                                                                 |
| PLAN_V2 reconciliation    | Reconcile referenced V2 reviews, especially V2-01 through V2-06     | Blocked; review materials not supplied                                                                                                     |
| GitHub enforcement        | Plan, repository visibility, remote existence and branch rules      | 2026-10-31 API: main protected; active ruleset 25961783 requires PR and strict Validate; no bypass actors; zero approving reviews required |
| React/Hooks lint coverage | Official Hooks preset plus React TypeScript preset                  | Verified; effective TSX rules and negative fixtures recorded in the handoff                                                                |
| Next.js ESLint coverage   | Official `@next/eslint-plugin-next` / Core Web Vitals preset        | Blocked; evaluated dependency graph produced five high audit findings through `braces`; re-evaluate after an upstream-compatible fix       |
| Human review path         | Independent human review availability for high-risk work            | Open; before protected remote workflow                                                                                                     |
| ADR-0004                  | Inactive automated-plan MVP and signed standing-owner authority     | Revision 2 accepted for local build only by PGJB-AUTO-PLAN-INACTIVE-BUILD-01; live activation and actual harness denial evidence blocked   |

The required `Validate` check is now platform-enforced configuration, verified
through read-only GitHub APIs. This supersedes the 2026-10-22 unprotected-state
snapshot, not the outstanding owner decisions. Zero approving reviews are
required by that rule; CODEOWNERS and last-push approvals are not required.
Independent human review, trusted release governance and deployment remain
gated. The [current handoff](../engineering/HANDOFF.md#stabilization-checkpoint---2026-10-31)
records exact evidence and its limits. No settings were changed in stabilization.

Phase 0's accepted modular-monolith direction and toolchain do not close these gates.

## D0 revision 1 and D1 local implementation - 2026-11-01

The direct owner decision `PGJB-PHASE2-D0-D1-01` revision 1 and subsequent D1
implementation request authorize the bounded scope in
[ADR-0005](adr/ADR-0005-phase-2-foundation.md). D0 directions for identity,
catalog and public exposure are recorded there, not permission to implement
D2/V1-V5. Database roles, migration/test tooling and the minimal organization
boundary are authorized locally; no shared/production database or hosted
operation is authorized.

No independent human reviewer is designated. Independent review, integration,
publication, merge and deployment remain open. Existing control-register
proposals, validators, autonomy guards and GitHub settings are unchanged.
Prepared CI is configured source, not a hosted result for this change.
See [D1 PostgreSQL verification](../engineering/HANDOFF.md#d1-postgresql-verification---2026-11-01)
for actual local migration, privilege, concurrency, pooling and recovery results.
Owner-installed Docker resolved the former environment block. This does not
constitute hosted CI evidence or independent approval.

DeepSeek live testing is explicitly **DEFERRED / NO-GO**. Draft PR #12 remains
an untouched, unmerged synthetic artifact. This pilot does not block approved
manual product development.

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

## Milestone 2 website R1 candidate

`PGJB-AUTO-PLAN-REAL-WEBSITE-R1-BUILD-01` authorizes the local increment recorded
in [ADR-0004](adr/ADR-0004-automated-plan-approval.md#milestone-2-real-website-r1-candidate).
It does not activate the new proposed website policy, enroll an owner signer,
certify a human-reviewed template or close any operational gate.

The two JSON field contracts are tested using disposable actual-repository
worktrees and the restricted SDK. Real admission is still blocked by compiled
guards. A separately reviewed OS isolation provider, authenticated enrollment,
owner template/policy review, immutable runtime installation and actual
credentialed model-continuation evidence remain requirements before activation.
SDK tool denial alone is not Windows filesystem isolation or VS Code enforcement.
