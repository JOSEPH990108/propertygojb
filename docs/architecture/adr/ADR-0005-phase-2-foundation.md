# ADR-0005: Phase 2 D0 Decisions and Local D1 Foundation

**Status:** owner-approved revision 1 defaults and bounded local D1 implementation;
integration, hosted execution and later increments remain gated.
**Decision:** `PGJB-PHASE2-D0-D1-01`, revision 1, 2026-11-01.
**Owner/source:** project owner's direct approval in the Phase 2 planning
conversation, followed by the explicit D1 implementation request. No independent
human reviewer was designated. This document records that decision; its contents
are not independently authenticated authority or a standing grant.
**Implementation base:** remote main
`e9a141ba7d428524a8fdf8cb160a87e5a8dbf635`, freshly fetched on 2026-11-01.
**Validation:** see the D1 section of [HANDOFF](../../engineering/HANDOFF.md);
source presence is not evidence of successful PostgreSQL execution.

## Scoped decisions

- Phase: leave Phase 1A only for local D1 implementation and synthetic validation.
  Preserve ADR-0001's one-repository Next.js modular monolith, strict TypeScript,
  domain application boundaries and reusable UI separation.
- ADR-ORG-001 / ADR-0002: minimal organizations identity (UUID, unique slug,
  display name, creation time), selected by trusted server configuration. No
  client organization selection, tenant onboarding, membership schema or RLS.
  Later owned records require non-null ownership and same-organization integrity.
- ADR-ID-001 direction for D2: Better Auth, PostgreSQL-backed sessions and one
  Microsoft Entra workforce tenant, MFA and pre-provisioned memberships. No public
  signup or local password fallback. Eight-hour absolute sessions, 30-minute idle
  expiry, five-minute freshness for privileged identity changes, application
  revocation, and no authorization cookie cache. Explicit admin permissions and
  assigned-agent permissions are server enforced. Provider availability/licensing,
  identity implementation and operational configuration remain D2 gates.
- ADR-CAT-001 direction for V1: project-level marketing listings, one canonical
  listing per project, project-owned layouts. Future units belong to a project
  and optionally a same-project layout. No unit/phase/tower tables until used.
- ADR-PUB-001 scoped direction: draft/published/archived; admin-only publishing;
  unpublish before editing and explicitly republish. Public DTO allowlists exclude
  private information. Prices default hidden and need an explicitly approved
  per-listing exposure setting. No versioned CMS.
- Database: PostgreSQL 18.6, node-postgres and Drizzle; reviewed committed SQL,
  separate database roles, synthetic disposable tests and dump/restore rehearsal.
- ADR-RELEASE-001: independent human review and existing required Validate before
  integration. No reviewer is yet designated. Publication, merge, hosted migration
  and deployment require separate authority. Zero required GitHub approving
  reviews is not equivalent to enforced independent review.

CRM, personal-data purpose/notice/retention, qualification, deduplication and
assignment decisions remain at V2/V3. Scheduling/timezone semantics remain at V4.
No future implementation approval is implied by recording its D0 direction.

## Approved dependency pins

Runtime: `drizzle-orm@0.45.4`, `pg@8.23.1`, `server-only@0.0.1`.
Development: `drizzle-kit@0.31.11`, `@types/pg@8.23.1`, `tsx@4.23.15`.
Retain Node 24.14.0, npm 11.12.0, Next.js 16.4.2, React 19.3.0 and the existing
toolchain. Do not follow release-candidate tags in current Drizzle examples.

Official PostgreSQL image:
`postgres:18.6-bookworm@sha256:5c4783a8cc3f0074912164f94dfa1be4e043438f0f707cf968d7af9a0d31a2c8`.

The owner accepted the existing 24 moderate lint-chain dependency findings for
bounded local D1 only. This is not an audit exemption or release acceptance.
New high/critical findings or incompatible pins require a new decision; never
force-fix or weaken checks.

During implementation, the exact pins resolved successfully but introduced four
additional moderate affected-package findings through
`drizzle-kit -> @esbuild-kit/esm-loader -> @esbuild-kit/core-utils -> esbuild@0.18.20`
([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)).
The owner separately accepted this new chain for bounded local D1 on 2026-11-01,
with esbuild serve and Drizzle Studio prohibited. No pin, override or audit gate
was changed to hide the finding. Remediation/disposition before integration and
release remains open.

## Exact revision 1 manifest

Modify: `package.json`, `package-lock.json`, `.github/workflows/ci.yml`,
`docs/architecture/DECISION_GATES.md`,
`docs/architecture/adr/ADR-0002-single-company-context.md`,
`docs/product/FIRST_VERTICAL_SLICE_ROADMAP.md`,
`docs/product/FEATURE_REGISTRY.md`, `docs/engineering/HANDOFF.md`.

Add:

- `.env.example`, `compose.db.yml`, `drizzle.config.ts`.
- `src/db/config.ts`, `src/db/client.ts`, `src/db/schema.ts`.
- `src/modules/organization/schema.ts`, `src/modules/organization/index.ts`.
- `scripts/db/bootstrap.ts`, `scripts/db/migrate.ts`,
  `scripts/db/seed-synthetic.ts`, `scripts/db/test.ts`.
- `test/db/config.test.ts`, `test/db/foundation.test.ts`,
  `test/db/recovery.test.ts`, `test/db/server-boundary.test.ts`.
- `drizzle/0000_organization_foundation.sql`,
  `drizzle/meta/0000_snapshot.json`, `drizzle/meta/_journal.json`.
- This ADR and `docs/engineering/DATABASE_DEVELOPMENT.md`.

No app UI, auth or business tables beyond organizations; no automation, control
register, validator, test weakening, signer or live-activation change. Package
changes affect dependency/runtime measurements; CI changes affect the required
Validate check. Neither can self-certify through tests changed in this increment.
The existing five proposed/advisory controls remain unchanged.

## Acceptance and rollback

Require configuration denials, server-only import failure, lazy imports/builds,
SQL generation/history consistency, empty-database migration and no-op replay,
concurrent migration exclusion, transactional failure, immutable-history checks,
organization constraints, runtime privilege denial, pool cleanup and synthetic
dump/restore with grants and journal verification. Run the unchanged existing
validation plus new checks. Review the complete base-to-worktree manifest/diff.

Docker was unavailable at implementation entry. Without an owner-provided
isolated PostgreSQL environment, database checks are BLOCKED, never PASSED.
Do not install system software, substitute a shared database or hide missing
integration coverage with mocks/skips.

The owner's PostgreSQL verification continuation on 2026-11-01 supplied Docker
Desktop/WSL 2 and authorized executing the existing local harness. Docker Engine
29.9.2, Compose 5.6.1, `desktop-linux` and actual PostgreSQL 18.6 were verified;
local database integration and recovery tests passed. See the
[verification handoff](../../engineering/HANDOFF.md#d1-postgresql-verification---2026-11-01)
for exact counts, test corrections, cleanup and full validation. This resolves
the environment block only, not independent review or operational authorization.

Failed migrations must not acquire successful journal entries. Never rewrite
applied SQL. Disposable cleanup is restricted to invocation-owned resources;
retained data requires reviewed forward repair or explicitly authorized restore.
Source rollback is owner-reviewed, preserving unrelated work. No commit, push,
PR, merge, production connection or deployment is authorized.

## Deferred AI pilot

DeepSeek live testing remains **DEFERRED / NO-GO**. Preserve draft PR #12,
unmerged and untouched. No workflow dispatch, AI credits, automatic review/repair,
merge or autonomous activation. Product work does not depend on this pilot.

## Technology sources

- [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql),
  [migrations](https://orm.drizzle.team/docs/migrations) and
  [history checks](https://orm.drizzle.team/docs/drizzle-kit-check).
- [node-postgres pools](https://node-postgres.com/features/pooling).
- [PostgreSQL backup/restore](https://www.postgresql.org/docs/18/backup-dump.html).
- [GitHub PostgreSQL services](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).
- [Better Auth sessions](https://better-auth.com/docs/concepts/session-management)
  and [Microsoft identity](https://better-auth.com/docs/authentication/microsoft).
