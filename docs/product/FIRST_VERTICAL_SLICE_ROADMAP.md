# First Database-Backed Vertical Slice

**Status:** D0 revision 1 defaults and local D1 approved; D2/V1-V5 and operational
authority remain separately gated. Original sequence below is retained as the
planning baseline, subject to the scoped update.
**Owner:** project owner; no independent reviewer designated.
**Source:** owner-requested stabilization and catalog -> enquiry -> CRM -> agent
follow-up planning, 2026-10-31; verified repository baseline
`bb4602635325be3e878286726f6fc46beee7726a`.
**Evidence:** [stabilization handoff](../engineering/HANDOFF.md#stabilization-checkpoint---2026-10-31),
[feature registry](FEATURE_REGISTRY.md), and
[decision gates](../architecture/DECISION_GATES.md).
No business behavior, schema or legacy production claim is inferred as approved.

## D1 scope update - 2026-11-01

Owner decision `PGJB-PHASE2-D0-D1-01` revision 1, followed by the explicit D1
implementation request, approves only the local foundation described in
[ADR-0005](../architecture/adr/ADR-0005-phase-2-foundation.md). Implementation is
based on freshly verified main `e9a141ba7d428524a8fdf8cb160a87e5a8dbf635`.
The organization boundary, exact database packages, SQL generation, scripts,
synthetic tests and CI service configuration are in scope.

The owner subsequently installed Docker Desktop/WSL 2. Actual local PostgreSQL
18.6 integration and recovery verification now passes; the earlier environment
block is resolved. Evidence is recorded separately from hosted CI and independent
human review in
[HANDOFF](../engineering/HANDOFF.md#d1-postgresql-verification---2026-11-01).
See [database development](../engineering/DATABASE_DEVELOPMENT.md) for the
owner-provided environment prerequisite and execution/recovery workflow.

The approved D0 defaults do not close D2 provider provisioning, V2/V3 CRM/privacy,
V4 scheduling or release gates. Independent human review and integration stay
open until a reviewer is designated. No push, PR, merge or deployment is included.
DeepSeek live testing remains **DEFERRED / NO-GO**, with draft PR #12 untouched.
It is not a dependency of D1.

## Outcome and non-goals

After explicit owner approval, a visitor can browse published properties and
submit an enquiry; authorized staff can qualify and assign it; the assigned
agent can record and complete follow-up. Persistent state, server authorization,
audit and retry behavior must be tested as one end-to-end synthetic journey.

Retain one Next.js modular monolith and one repository. Routes compose
domain-owned application interfaces. Create only real modules needed by an
approved increment; do not pre-scaffold eight or twelve empty contexts.
PostgreSQL/Drizzle is the recorded intended direction, not approval to install
packages, create a database, choose hosting or run migrations.

Excluded: booking/reservation, payments/refunds, private document uploads,
multi-agency onboarding, a visual CMS, runtime feature-flag infrastructure,
external WhatsApp/email/SMS automation, data migration from production and
autonomous task execution. The existing static homepage remains available until
an approved product change deliberately replaces or extends it.

## Prioritized PR sequence and dependencies

These are proposed PR scopes, not existing PRs. Each requires its own bounded
owner approval and human review; none authorizes push, merge or deployment.

| Order   | Proposed PR                                                                | Depends on                                                  | Acceptance evidence / exit gate                                                                                                                                            |
| ------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S0 / P0 | Stabilize website rehearsal and reconcile evidence (current local work)    | Verified latest main                                        | Main-source and feature-source regression pass; full local pipeline; owner-reviewed exact diff; actual PR and post-merge main CI still required                            |
| S1 / P1 | Triage/remediate moderate lint-chain dependency advisory                   | S0 baseline                                                 | Preserve approved lint coverage and toolchain; review lockfile/provenance; audit and complete validation; no blanket `audit fix --force`                                   |
| S2 / P1 | Repair advisory AI transport/schema compatibility                          | Separate exact-scope owner approval; reviewed baseline      | Preserve strict local verdict semantics; malformed/stale/scope-denied tests; authorized synthetic hosted round trip and failure evidence, no automatic execution           |
| D0 / P0 | Approve first-slice product/data/access ADRs                               | S0 integrated and owner review path identified              | Authenticated decision source, owner, exact version/scope, statuses and acceptance criteria; explicitly authorize leaving governance-only scope                            |
| D1 / P1 | Approved database foundation and migration/test harness                    | D0, dependency risk disposition                             | Pinned approved dependencies; non-production configuration validation; disposable PostgreSQL integration tests; forward migration plus restore/rollback rehearsal          |
| D2 / P1 | Staff identity, membership and server authorization boundary               | D1, ADR-ID-001 and ADR-ORG-001                              | Authenticated principal and trusted organization resolution; deny unauthenticated, wrong-role and wrong-owner access at every protected boundary                           |
| V1 / P1 | Minimal property catalog: authorized maintenance and published public read | D2, ADR-CAT-001 and public exposure decision                | Constrained schema and stable IDs; public projection excludes draft/private fields; pagination/filter bounds; create/update/read and forbidden-path integration tests      |
| V2 / P1 | Durable public enquiry intake linked to catalog                            | V1, ADR-CRM-001 and privacy/abuse decisions                 | Valid property reference, server validation, consent/notice, durable save before success, idempotent retry, atomic audit; no external message or silent success on failure |
| V3 / P1 | Minimal CRM qualification and assignment                                   | V2, approved qualification/ownership transitions            | Atomic enquiry-to-contact/opportunity link, retry/dedup semantics, conflict-safe assignment and audit; unauthorized read/write and concurrent-claim tests                  |
| V4 / P1 | Agent follow-up list, scheduling and completion                            | V3, ADR-SCHED-001                                           | Assigned-agent access; approved due-time/timezone semantics; persistent outcome/history; atomic completion and concurrency tests; no automatic outbound contact            |
| V5 / P1 | Whole-slice hardening and owner release review                             | V1-V4; unresolved dependency and review risks dispositioned | Browser journey plus DB integration/denial/retry/concurrency tests; migration recovery and redacted observability evidence; separate non-production rollout approval       |

Dependency spine: `S0 -> D0 -> D1 -> D2 -> V1 -> V2 -> V3 -> V4 -> V5`.
S1 and S2 are separate stabilization tracks, not excuses to broaden S0.
AI review is advisory: its outage must not be converted into a dependency on
autonomous execution. The owner must decide whether an independent human review
path is sufficient while S2 is blocked; an AI PASS is not a substitute.

## Decisions required before implementation

| Gate / owner decision                   | Must resolve                                                                                                                                                      | Earliest blocker                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Phase authorization and ADR-RELEASE-001 | Explicitly authorize the product slice, identify responsible reviewer, define permitted local/staging operations and merge/release separation                     | D0; no product coding under Phase 1A governance-only scope    |
| ADR-ORG-001 / ADR-0002                  | Single-company identity, ownership boundary and future isolation seam; no trusted client organization ID                                                          | D1 schema                                                     |
| ADR-ID-001                              | Auth provider, staff provisioning, session lifecycle, roles vs permissions, membership revocation and resource ownership rules                                    | D2; no inferred admin/agent privileges                        |
| ADR-CAT-001                             | Initial listing granularity (project vs unit), required hierarchy and cross-project integrity; published fields, availability semantics and price visibility      | V1 schema/public read                                         |
| ADR-PUB-001 scoped exposure decision    | What is public, who can publish and how unpublished/private data is excluded; decide whether minimal publication fits a bounded decision or needs full versioning | V1 public read; no visual editor implied                      |
| ADR-CRM-001                             | Enquiry vs contact vs opportunity, required fields, dedup/retry policy, lifecycle, assignment/claim rules and whether one contact can have multiple opportunities | V2/V3                                                         |
| Privacy and abuse handling              | Purpose/notice/consent, minimization, retention/deletion, access audit, spam/rate limits and whether anonymous enquiry is allowed                                 | V2 before personal-data collection                            |
| ADR-SCHED-001                           | Business timezone, storage/display conversion, due/overdue definitions, follow-up ownership, outcome and reschedule rules                                         | V4                                                            |
| Database/operations approval            | Driver/ORM versions, local and CI test service, secrets custody, migration executor, backup/restore, approved staging environment and rollback owner              | D1 for local setup; separate gate before any hosted operation |
| Legacy evidence / PLAN_V2               | Supply missing V2-01 through V2-06 material or explicitly approve a scoped deferral; reverify relevant legacy behavior rather than copying it                     | Any decision relying on that material                         |

No approval was found closing these business gates. Accepted ADR-0001 and
ADR-0003 establish direction/toolchain, not the detailed schema or operational
authority. Do not change a status field to manufacture approval.

## Proposed domain responsibilities

- **Catalog:** start with `src/modules/catalog/` only when V1 is authorized;
  own catalog integrity, publication projection and queries. Route components
  call its public application interface instead of embedding business rules.
- **CRM:** proposed `src/modules/crm/` owns enquiry intake, contact/opportunity
  relationship and assignment. Reuse catalog's application boundary or approved
  referential contract; do not duplicate public-visibility rules in a route.
- **Follow-up:** initially a bounded capability under CRM unless the approved
  scheduling decision establishes a separate domain. Do not create a scheduling
  subsystem just to deliver an assigned-agent task list.
- **Identity/access and database plumbing:** the exact minimal placement is a D0
  decision. Keep UI feature visibility separate from reusable component behavior
  and from server permissions. Ownership checks apply to reads as well as writes.

Candidate data concepts are catalog item, enquiry, contact, opportunity,
assignment, follow-up and business audit event. Their cardinalities, identifiers,
status enums and uniqueness rules remain proposals until the owning ADRs are
approved. Use database constraints for referential/uniqueness invariants;
application pre-checks alone are insufficient under concurrency.

## Required verification by increment

1. **Database foundation:** migrations apply to an empty disposable database;
   schema constraints reject invalid relations; restore/rollback is rehearsed
   using synthetic data. CI must never share a production connection string.
2. **Authorization:** test anonymous, revoked, wrong-role and wrong-owner access,
   forged organization fields, alternate transport paths and direct mutation
   attempts. Hidden buttons do not count as authorization tests.
3. **Catalog:** public list/detail cannot expose drafts, private attributes or
   unapproved prices through payloads, metadata or caches. Missing, unpublished,
   malformed and out-of-scope IDs produce explicit approved responses.
4. **Enquiry/CRM:** durable commit before success; transactionally couple business
   mutations and audit. Test retries, duplicate submissions, stale versions,
   concurrent assignments, constraint failures and rollback. Agree idempotency
   key scope/retention before implementing it; do not invent dedup business rules.
5. **Follow-up:** persist assignment-bound due dates/outcomes, test timezone
   boundaries, concurrent completion, reassignment and revoked access. No PII in
   routine logs or test evidence; synthetic data only.
6. **End to end:** public catalog -> enquiry -> staff qualification/assignment ->
   assigned-agent follow-up -> durable audit; denied users cannot observe or
   mutate another owner's record. Verify reloads and retries, keyboard use and
   narrow/wide layouts. Run the full existing pipeline plus approved DB/browser
   checks; current SDLC tests do not certify future business behavior.

## Operational and autonomy boundaries

Real task execution remains inactive; compiled admission guards and proposed
policies are untouched. Activation would separately require an authenticated
signer/grant, immutable runtime, OS isolation, actual model and denied-tool
evidence, audit recovery/retention, and an explicitly reviewed activation change.
None is a prerequisite to manually implement the approved product slice.

Current platform rules require a PR and `Validate`, but zero approving reviews.
Deciding and enforcing an independent human review path is still owner work.
No changes to repository rules, secrets, providers or deployment are authorized
by this roadmap. Any later migration/release must record exact commands, results,
rollback criteria and responsible owner in its own handoff.
