# Feature Registry

This is a navigation index, not proof of implementation. Verify the cited source and checks before relying on an entry. `implemented`, `partial`, `planned`, `blocked` and `deprecated` describe product capability status; they do not approve architecture proposals.

## D1 local update - 2026-11-01

- **PGJB-DB-001 - partial:** approved local PostgreSQL/Drizzle foundation source
  under `src/db/`, `src/modules/organization/`, `drizzle/`, `scripts/db/` and
  `test/db/`; authorization in
  [ADR-0005](../architecture/adr/ADR-0005-phase-2-foundation.md).
  Configuration/server-boundary checks are independent of database execution.
  Owner-provided Docker now supports passing local PostgreSQL migration,
  privilege, concurrency, pooling and restore verification. Independent review,
  integration and hosted CI remain outstanding; `partial` is not a production
  readiness claim. See
  [actual evidence](../engineering/HANDOFF.md#d1-postgresql-verification---2026-11-01).
- Current source base is `e9a141ba7d428524a8fdf8cb160a87e5a8dbf635`.
  Its [main Validate run](https://github.com/JOSEPH990108/propertygojb/actions/runs/41278151828)
  passed. This supersedes the older failing-main snapshot below, but is not CI
  evidence for uncommitted D1 changes.
- Catalog, staff identity, enquiries, CRM and follow-up remain unimplemented.
  No customer/business capability or production readiness is asserted.
- AI live testing remains deferred at **NO-GO**; draft PR #12 is unchanged.

## Historical registry snapshot - 2026-10-31

| ID            | Capability                                               | Status      | Owner paths                                                                                                  | ADR                                                    | Evidence and checks                                                                                                                                   | Last verified                             |
| ------------- | -------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| PGJB-FND-001  | Next.js repository foundation and baseline validation    | implemented | `src/app/`, `package.json`, `.github/workflows/ci.yml`                                                       | ADR-0001, ADR-0003                                     | [Current handoff](../engineering/HANDOFF.md#stabilization-checkpoint---2026-10-31); main CI failed; local repair evidence is separate                 | `bb46026` source, 2026-10-31              |
| PGJB-WEB-001  | Static informational homepage and JSON theme/content     | implemented | `src/app/page.tsx`, `src/app/globals.css`, `src/content/`                                                    | ADR-0001; ADR-0004 inactive candidate                  | Source verified; static website, not property search or enquiry intake                                                                                | `bb46026`, 2026-10-31                     |
| PGJB-SDLC-001 | Control register, validators and governance tests        | partial     | `docs/sdlc/`, `scripts/sdlc/`, `test/sdlc/`                                                                  | Open release gate                                      | Five R0-R4 entries remain proposed/advisory; PR and Validate requirement verified separately                                                          | `bb46026`, 2026-10-31                     |
| PGJB-AI-001   | Manual advisory AI PR reviewer prototype                 | blocked     | `.github/workflows/ai-sdlc.yml`, `.github/ai-sdlc/`                                                          | Open release/provider gates                            | [Latest hosted failure](../engineering/AI_SDLC_DEEPSEEK.md#observed-hosted-failure---2026-10-31): provider schema rejection, not a successful verdict | Run `40648708160`, inspected 2026-10-31   |
| PGJB-AUTO-001 | Plan bridge, SDK runner and disposable website rehearsal | partial     | `scripts/sdlc/plan-bridge.mjs`, `scripts/sdlc/task-orchestrator.mjs`, `scripts/sdlc/workspace-admission.mjs` | ADR-0004 inactive build only                           | Deterministic/synthetic capability; real activation compiled-blocked; actual model/OS evidence outstanding                                            | `bb46026` plus local test fix, 2026-10-31 |
| PGJB-CAT-001  | Database-backed property catalog                         | planned     | No implemented domain module                                                                                 | ADR-ORG-001, ADR-ID-001, ADR-CAT-001, ADR-PUB-001 open | [Proposed roadmap](FIRST_VERTICAL_SLICE_ROADMAP.md); no schema, database or product approval                                                          | 2026-10-31 planning only                  |
| PGJB-CRM-001  | Enquiry, CRM and agent follow-up                         | planned     | No implemented domain module                                                                                 | ADR-CRM-001, ADR-ID-001, ADR-SCHED-001 open            | [Proposed roadmap](FIRST_VERTICAL_SLICE_ROADMAP.md); no customer intake or agent workflow exists                                                      | 2026-10-31 planning only                  |

No database-backed customer/business capability is asserted. The source references,
not these rows, establish what exists. The current main CI result and the
uncommitted local stabilization result must not be conflated.
