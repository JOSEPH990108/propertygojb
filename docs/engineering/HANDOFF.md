# Engineering Handoff

## D1 hosted installation guard remediation - 2026-11-01

**Authority/source:** owner's direct "D1 Hosted CI Security-Guard Remediation"
request authorizes this exact investigation and necessary local correction.
It does not authorize commit, push, PR updates, hosted reruns, integration or
deployment. Published base remains
`002b2a37d0ae0ff5e734e36d4ffc40868d73a35e`; Draft PR #13 and its failed
[hosted run 41300545354](https://github.com/JOSEPH990108/propertygojb/actions/runs/41300545354)
remain unchanged.

### Root cause: PROVEN in a disposable local Linux reproduction

The hosted stack fails while measuring the project dependency root, not npm's
installation. Reproduction used the published commit and exact lockfile, Node
24.14.0, npm 11.12.0, Linux x64, and a non-root UID 1000 process in a dedicated
Docker container with no host mounts, secrets or exposed ports. The official
Node image was pinned to linux/amd64 digest
`sha256:1698b8f453a36aa5b2545a0ab21b1781bef5c62a4626a2e8d2a01e7cde4fad45`.
Only the isolated container's npm installation was updated; no host installation
or project dependency pin changed.

Sanitized metadata found exactly six rejected regular files, grouped into three
same-inode pairs; each had link count 2 and mode 0755. Paths below are relative
to the project's dependency installation, not private absolute paths:

| Version | CLI binary                                                 | Matching platform binary                                              |
| ------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| 0.25.12 | `esbuild/bin/esbuild`                                      | `@esbuild/linux-x64/bin/esbuild`                                      |
| 0.18.20 | `@esbuild-kit/core-utils/node_modules/esbuild/bin/esbuild` | `@esbuild-kit/core-utils/node_modules/@esbuild/linux-x64/bin/esbuild` |
| 0.28.2  | `tsx/node_modules/esbuild/bin/esbuild`                     | `tsx/node_modules/@esbuild/linux-x64/bin/esbuild`                     |

The first rejected sorted entry was `@esbuild/linux-x64/bin/esbuild`.
All aliases were accounted for inside that reproduced dependency root; there
were no special-file failures. The npm root passed measurement. Windows roots
also passed with no rejected entries.

The pinned esbuild installers explicitly hard-link their platform binary into
the CLI location as a non-Windows/npm optimization. Their Windows branch skips
that operation. The unmodified guard correctly rejects these hard links; this
is an installation-layout incompatibility with an intentional fail-closed
invariant, not justification to allow hard links generally.

The same three hosted failures were reproduced locally with
`UNSAFE_INSTALLATION_FILE`. The original hosted log did not record its exact
entry metadata; the specific paths above are verified local Linux evidence, not
invented hosted instrumentation.

### Bounded correction and security impact

Five paths differ from the published D1 commit:

- Added `scripts/sdlc/prepare-esbuild-installation.mjs`.
- Added `test/sdlc/prepare-esbuild-installation.test.mjs`.
- Modified `.github/workflows/ci.yml`: one mandatory preparation step after
  `npm ci`, before the unchanged checks.
- Modified `docs/engineering/DATABASE_DEVELOPMENT.md` and this handoff.

Preparation is Linux x64-only, for a fresh private installation before any
runtime digest enrollment. It verifies the exact three package versions, regular
binary type/mode, shared identity and both links' presence inside the fixed
layout. Unexpected or external aliases are not accepted. Only the CLI alias is
replaced by a byte-identical, mode-preserving independent file. No in-place
write to the shared inode occurs.

Directory descriptors and no-follow/nonblocking opens anchor traversal and
atomic rename; bounded descriptor reads, identity/content rechecks and exclusive
temporary creation cover the tested replacement/tampering cases. Cleanup never
deletes a pre-existing temporary-file collision. The unchanged full installation
guard runs after preparation; unrelated unsafe files still fail. This is not
OS attestation or permission to repair an enrolled or concurrently modified
runtime. On failure, stop and recreate the disposable installation.

`installationTreeHash`, `measureInstallation`, all original tests, policies,
authorization rules, package pins/lockfile, database schemas/migrations and AI
workflow remain unchanged. The existing CI bytes are identical after removing
the one new two-line step. No existing test, audit or validation gate was relaxed.

### Actual verification

| Environment / command                                                                                                                                                                                         | Result                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local Linux baseline focused selector                                                                                                                                                                         | Expected failure: three original cases failed with `UNSAFE_INSTALLATION_FILE`; one additional matched model-ID test passed.                                                                     |
| Local Linux `node --test test/sdlc/prepare-esbuild-installation.test.mjs`                                                                                                                                     | 13 passed, 0 failed, 0 skipped.                                                                                                                                                                 |
| Local Linux `node scripts/sdlc/prepare-esbuild-installation.mjs`                                                                                                                                              | Passed; separated exactly three real installed pairs. A second run passed with zero changes. Dependency and npm measurement then both passed.                                                   |
| Local Linux `node --test --test-name-pattern="real public SDK rejects\|supported SDK declarations\|operator-selected website model binds" test/sdlc/task-orchestrator.test.mjs test/sdlc/website-r1.test.mjs` | Exactly the three previously failing tests passed; 0 failed/skipped. No model turn or credential used.                                                                                          |
| Local Linux `npm run test:sdlc`                                                                                                                                                                               | 285 passed, 0 failed, 2 live-model skips; 287 total, exit 0. Remediation source and lockfile matched the Windows candidate byte-for-byte.                                                       |
| Windows focused installation/alias selector across four test files                                                                                                                                            | 4 passed, 0 failed, 2 Linux-only skips; existing hardlink/reparse and content-drift regressions passed.                                                                                         |
| Windows `npm run validate`                                                                                                                                                                                    | Passed in full, exit 0: 298 passed, 0 failed, 18 skipped, 316 tests total.                                                                                                                      |
| Windows `npm run test:sdlc` within validate                                                                                                                                                                   | 269 passed, 0 failed, 18 skipped: four existing POSIX tests, twelve new Linux-specific preparation tests, two disabled live-model tests. None of the three original failing tests was disabled. |
| `npm run test:db:unit` within validate                                                                                                                                                                        | 16 passed, 0 failed/skipped, including actual Next server/client boundary builds.                                                                                                               |
| `npm run test:db` within validate                                                                                                                                                                             | 13 passed, 0 failed/skipped against real disposable PostgreSQL 18.6, including privileges, migration/concurrency/rollback, pooling and dump/restore.                                            |
| SDLC validators, formatting, lint, typecheck, audit threshold, build and migration-history check within validate                                                                                              | All passed. Audit retains 28 moderate findings and zero high/critical; no overrides or force-fixes.                                                                                             |
| Manifest/control-invariance assertions and `git diff --check`                                                                                                                                                 | Passed; original guard, tests, policies, pins, lock and database remain unchanged.                                                                                                              |

The first new regression run had 9 passes/1 failure because its symlink assertion
encountered other fixture hardlinks first. The fixture was isolated by preparing
its legitimate pairs before injecting the escaping link; the exact denial
assertion was retained. Focused lint initially found missing explicit Node
imports, corrected without changing lint rules. An initial Docker-copy transfer
could not read the bundled fixture; that owned container was removed, and
streaming files as the non-root user resolved setup. These are not passing runs.

The full Linux suite and Windows validation cover identical executable changes.
Only this result recording followed those runs; final formatting, scope and
whitespace checks cover that documentation addition. No complete Linux
PostgreSQL pipeline or new GitHub-hosted run is claimed.

All invocation-owned containers and named reproduction scratch files were
removed; Docker reported no remaining containers or volumes. Downloaded official
images remain cached. No unrelated Docker resource was deleted.

### Remaining gates

**Local remediation is verified; publication and final merge review remain
BLOCKED pending separate decisions.** An independent human must review this
installation/CI correction. The owner must separately authorize any remediation
commit, publication/PR update and hosted Validate rerun, including the revised
candidate under the publication/CI-only risk exception. Its existing expiry
remains November 15, 2026 or the next D2 approval, whichever is earlier; this
does not grant integration-risk acceptance. Successful hosted PostgreSQL stages
are still required. No new host installation or production credentials are
needed. DeepSeek remains NO-GO and Draft PR #12 is untouched.

## D1 PostgreSQL verification - 2026-11-01

**Authority:** owner's explicit PostgreSQL verification continuation of
`PGJB-PHASE2-D0-D1-01` revision 1. Existing worktree
`C:\Users\chong\Desktop\propertygojb-d1-foundation`, branch
`feature/d1-database-foundation`, base
`e9a141ba7d428524a8fdf8cb160a87e5a8dbf635`. No new worktree, branch, dependency
installation, commit, push, PR, merge, deployment or system configuration change.
The earlier blocked implementation report below is historical; this section
supersedes its Docker/PostgreSQL block.

### Environment and safety evidence

- `docker version`: client/engine 29.9.2, Docker Desktop 4.97.0.
- `docker compose version`: 5.6.1.
- `docker info --format '{{.OSType}}'`: `linux`;
  `docker context show`: `desktop-linux`. Existing PATH worked without changes.
- `docker ps`, `docker ps -a`, `docker volume ls`: no containers or volumes at
  entry. Only default bridge/host/none networks existed. No unrelated resources
  were deleted. Optional fixed port 55432 had no listener; harness uses dynamic
  loopback ports and random container names instead.
- `docker manifest inspect` verified the exact approved PostgreSQL image index
  digest `sha256:5c4783a8cc3f0074912164f94dfa1be4e043438f0f707cf968d7af9a0d31a2c8`
  and linux/amd64 child digest
  `sha256:41a369edc91d9bdd7a58be6bc71ea0f8f7a3f49e82818a9f0829021ea7840b7c`.
  Local `docker image inspect` confirmed the same RepoDigest and platform.
- `docker compose -f compose.db.yml config --quiet` passed using explicit
  synthetic mode/instance/port variables; Compose services were not started.
- Actual PostgreSQL `SHOW server_version_num` returned `180006` (18.6).
- Source inspection confirmed synthetic-only credentials/fixtures, unprivileged
  digest-pinned containers, loopback-only exposure, tmpfs data, separate roles
  and exact invocation-owned cleanup. No hosted/production database was used.

### PostgreSQL execution and test correction

1. Original `npm run test:db`: 11 passed, 0 failed, 0 skipped; exit 0.
2. Critical review found the migration-failure test accepted any rejection,
   potentially hiding a failure before SQL execution. It now requires SQLSTATE
   `22012` from the injected division by zero. Added direct version, role
   attributes/memberships/grants and 12-query/five-client pool assertions.
3. First strengthened run: 12 passed, 1 failed, 0 skipped; exit 1. PostgreSQL
   correctly raised division by zero, but Node's nested-object exception matcher
   deep-compared the whole error rather than just its code. Replaced that matcher
   with a typed error/cause-code assertion, preserving the exact failure criterion.
   The failed harness run still cleaned up its container and left no volumes.
4. Corrected `npm run test:db`: 13 passed, 0 failed, 0 skipped; exit 0.

Only `test/db/foundation.test.ts` changed executable test behavior in this
continuation; no runtime implementation, SQL migration, package, lockfile or
workflow correction was necessary.

Passing PostgreSQL evidence covers bootstrap/schema creation; repeated migration
and seed with an unchanged journal; null/UUID/uniqueness/format/length constraints;
runtime DDL/DML/TEMP/journal/role-escalation denials; nonprivileged migration/runtime
attributes and no memberships; server-selected organization and missing-context
failure; conflicting seed rejection; actual advisory-lock contention and replay;
DDL rollback and no success journal on SQLSTATE 22012; modified applied-SQL hash
rejection; transaction rollback; pool limits/query-failure recovery/shutdown;
test-only compound ownership FKs; and binary `pg_dump`/transactional `pg_restore`
with row/constraint/grant/journal comparison and no-op replay.

### Complete validation and diff review

`npm run validate` passed in full with exit 0, including actual PostgreSQL. The
final aggregate is 303 tests: 297 passed, 0 failed, 6 skipped. The skips remain
the four Windows-inapplicable POSIX mode tests and two explicitly disabled
live-model tests. They do not constitute model or POSIX verification.

| Command                                                     | Actual result                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run test:db` (original suite)                          | 11 passed, 0 failed, 0 skipped; exit 0.                                                                      |
| `npm run test:db` (first strengthened run)                  | 12 passed, 1 failed, 0 skipped; exit 1 due to nested error-matcher semantics, corrected as documented above. |
| `npm run test:db` (corrected suite)                         | 13 passed, 0 failed, 0 skipped; exit 0.                                                                      |
| `npm run sdlc:validate`                                     | Passed; five proposed controls, no authority activated.                                                      |
| `npm run sdlc:ai-sdlc:validate`                             | Passed; deterministic local self-check, no model/provider call.                                              |
| `npm run sdlc:plan:validate`                                | Passed; live activation remains blocked.                                                                     |
| `npm run test:sdlc`                                         | 268 passed, 0 failed, 6 skipped; exit 0.                                                                     |
| `npm run format:check`                                      | Passed.                                                                                                      |
| `npm run lint`                                              | Passed, zero warnings.                                                                                       |
| `npm run typecheck`                                         | Passed.                                                                                                      |
| `npm audit --audit-level=high`                              | Passed threshold; 28 moderate findings, no high/critical findings.                                           |
| `npm run build`                                             | Passed; Next.js 16.4.2, 3/3 static pages, unchanged application.                                             |
| `npm run db:check`                                          | Passed.                                                                                                      |
| `npm run test:db:unit`                                      | 16 passed, 0 failed, 0 skipped; includes positive/negative actual Next builds.                               |
| `npm run test:db` (inside full pipeline)                    | 13 passed, 0 failed, 0 skipped; actual PostgreSQL 18.6 and dump/restore.                                     |
| `npm run validate`                                          | **PASSED**, exit 0; no bypass or skipped database stage.                                                     |
| `npm.cmd run db:generate -- --name=organization_foundation` | Passed; no new migration and all SQL/metadata SHA-256 hashes unchanged.                                      |
| `git diff --check`                                          | Passed; repeated after final documentation recording.                                                        |
| Manifest/control invariance checks                          | Exact 29 authorized paths; no existing controls weakened.                                                    |

A further **local synthetic CI-service-path rehearsal**, not a hosted Actions
run, created a specifically owned digest-pinned container using the CI role,
health and label configuration with a random instance and dynamic loopback port.
It set `GITHUB_ACTIONS=true`, `PGJB_DB_MODE=test`, and the exact container/instance/
port in that one shell, then ran `npm run test:db`: 13 passed, 0 failed, 0 skipped.
After the harness returned, `docker inspect` confirmed the caller-owned service
was still running (the harness correctly did not remove it). The outer rehearsal
removed only its recorded container ID. `docker ps -a` and `docker volume ls`
again showed no remaining containers or volumes. The ordinary harness also
cleaned its own resource on both success and the recorded failed test run.
Only the default Docker networks remained; no network/image/volume prune ran.
The pulled approved image remains cached, not a running database.

Existing CI header/step bytes, action pins, permissions,
triggers, timeout, audit threshold and original validation prefix are preserved.
Existing dependency versions/integrities and overrides match the base lockfile.
App/content, original SDLC tests/validators, AI workflow/policies, CODEOWNERS and
control register remain unchanged.

The D1 branch still has 8 modified and 21 untracked/new authorized files; HEAD
and freshly checked remote main remain the recorded base. No changes are staged
or committed. Original worktree remains on `docs/p1a-s4-local-validation` with its
pre-existing untracked `.vscode/` only. Draft #12 remains open, draft and unmerged
at `feaaadb00a1d62b0d32fc0256d98a8bca098c017`.
Final changes after the complete pipeline only record these documentation
results; formatting, whitespace, scope and resource checks are repeated.

### Remaining limits

This is local testing and advisory code review, not hosted GitHub execution,
independent human review, production readiness, OS isolation attestation or a
production backup/RPO/RTO claim. A forced process/host termination can interrupt
cleanup; inspect the exact invocation-owned resource before recovery, never
prune or delete by name prefix. Docker administrators remain trusted.

The 28 moderate dependency findings retain their documented local-only owner
acceptance, including the four esbuild-chain findings; no esbuild serve/Studio,
new override or audit relaxation. Independent review and integration/release
dependency disposition remain required. No reviewer is designated. D2/V1-V5 and
all hosted/publication/merge/deployment operations need separate authority.
DeepSeek remains DEFERRED / NO-GO; synthetic draft PR #12 stays untouched.

**Recommendation:** READY for owner-reviewed PR preparation, not authorized for
publication or integration. No further installation is needed for local D1.
The owner must designate an independent reviewer, disposition dependency risk
for integration (current acceptance is local-only), and separately authorize
commit/push/PR operations. A hosted Validate run is still required after an
authorized publication. No additional approval for identical D1 verification is
needed, and no production credentials/customer data should be provided.

## D1 local foundation - 2026-11-01

**Authority:** direct owner decision `PGJB-PHASE2-D0-D1-01` revision 1 plus the
subsequent explicit local D1 implementation request. See
[ADR-0005](../architecture/adr/ADR-0005-phase-2-foundation.md) for the exact scope,
dependency pins, owner follow-up risk disposition and remaining gates.

**Source:** freshly fetched remote main
`e9a141ba7d428524a8fdf8cb160a87e5a8dbf635`; isolated local branch
`feature/d1-database-foundation` in `propertygojb-d1-foundation`. No commit, push,
PR, merge or deployment. The original worktree and unrelated files are preserved.
The base's [Validate run](https://github.com/JOSEPH990108/propertygojb/actions/runs/41278151828)
passed; that is not CI evidence for these local changes.

**Implemented source:** minimal organizations schema and trusted resolver,
server-only lazy pool/configuration, synthetic container/database guards,
bootstrap/runtime/migration role separation, committed-format SQL and history
metadata, locked migration runner, explicit seed, disposable test runner,
integration/recovery fixtures and configured CI service. No app UI, auth, catalog
or CRM behavior was changed. The SQL was generated from the typed schema and
reviewed with explicit schema-USAGE/table-SELECT grants appended; it has not been
executed against PostgreSQL.

**Environment:** Node 24.14.0, npm 11.12.0. Docker CLI is unavailable. No container,
database, migration application, production connection or system installation
was attempted. Database checks are **BLOCKED**.

### Validation evidence

Early focused checks: approved dependency resolution and `npm ci` passed;
TypeScript and 15 database-independent tests passed after fixing configuration
environment types and matching the version-specific Next server-only diagnostic.
The first test run had 14 passes/1 failure due solely to the diagnostic assertion;
the positive server build and negative client build both executed.
The initial schema export omitted the schema object; it was corrected and the
unapplied first migration regenerated. A subsequent generation attempt exposed
Drizzle Kit's missing-journal handling for an empty metadata directory; removing
only that empty generated directory allowed proper regeneration.
Final generation produced no schema change and left every SQL/metadata hash
unchanged; `npm run db:check` and `npm run lint` passed.

The observed zero-exit Drizzle generation error is now guarded: the generation
wrapper requires explicit tool success, nonempty migration history and a
successful history check. A focused test rejects invalid configuration instead
of accepting the tool's unreliable exit status. This is a D1 command fix, not a
Drizzle dependency substitution.

The final complete `npm run validate` was run after that hardening. All existing
gates and independent D1 checks passed; the final PostgreSQL step returned exit 78. The aggregate validation is therefore **BLOCKED / nonzero**, not passed.

| Command                                                 | Actual final result                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm install --package-lock-only --ignore-scripts`      | Passed; resolved only the approved dependency pins.                                                         |
| `npm ci`                                                | Passed from the generated lockfile; 317 packages installed. Lockfile remains uncommitted.                   |
| `npm run sdlc:validate`                                 | Passed; five proposed controls, no authority authenticated or activated.                                    |
| `npm run sdlc:ai-sdlc:validate`                         | Passed; local schema/policy self-check only, no provider call.                                              |
| `npm run sdlc:plan:validate`                            | Passed; policy structure valid, live activation blocked.                                                    |
| `npm run test:sdlc`                                     | Passed: 268 passed, 0 failed, 6 skipped, 274 total.                                                         |
| `npm run format:check`                                  | Passed; all matched files conform.                                                                          |
| `npm run lint`                                          | Passed with zero warnings.                                                                                  |
| `npm run typecheck`                                     | Passed; route types and strict TypeScript, including authored DB test sources.                              |
| `npm audit --audit-level=high`                          | Passed threshold; zero high/critical, 28 moderate findings remain.                                          |
| `npm run build`                                         | Passed: Next.js 16.4.2, 3/3 static pages, no DB connection/configuration required.                          |
| `npm run db:generate -- --name=organization_foundation` | Passed through hardened wrapper; no schema change. Before/after hashes of all SQL/metadata files unchanged. |
| `npm run db:check`                                      | Passed; migration history structure only, not live PostgreSQL verification.                                 |
| `npm run test:db:unit`                                  | Passed: 16 passed, 0 failed, 0 skipped; includes real Next server/client build boundary.                    |
| `npm run test:db`                                       | BLOCKED, exit 78: `DB_DOCKER_ENGINE_UNAVAILABLE`; no PostgreSQL test executed.                              |
| `npm run validate`                                      | BLOCKED, exit 78 at its final DB step; all preceding commands above passed.                                 |
| `git diff --check`                                      | Passed.                                                                                                     |

The six SDLC skips are four POSIX mode tests on Windows and two opt-in live-model
tests. Live-model testing was explicitly disabled. Skips do not attest POSIX or
model behavior. Migration application, replay, concurrency, constraints, runtime
privileges and dump/restore are authored/typechecked only, not passing tests.

The 29 changed paths match the exact approved manifest (8 modified, 21 added).
Base-to-worktree review found no app/content, existing SDLC test/validator, AI
policy/workflow, CODEOWNERS or control-register changes. Every existing CI
header/step byte is preserved with three new mandatory steps; permissions,
triggers, action pins, required-job name and timeout are unchanged. An ad hoc
YAML inspection initially lacked `js-yaml`; no dependency was added. Retrying with
installed Prettier YAML parsing and byte-invariance assertions passed for CI and
Compose. Both use the same immutable PostgreSQL image.

The original checkout remains on `docs/p1a-s4-local-validation`, with only its
pre-existing untracked `.vscode/`. D1 HEAD and remote main still equal the stated
base. Draft #12 remains open, draft, unmerged, with head
`feaaadb00a1d62b0d32fc0256d98a8bca098c017`.
Only this handoff's result recording changed after the final full run; formatting
and diff checks are repeated after that documentation-only update.

### Dependency findings and controls

`npm audit --audit-level=high` passed: zero high/critical; 28 moderate
affected-package findings. The existing 24 minimatch/lint-chain findings remain.
Four new findings come from Drizzle Kit's esbuild-kit chain ending at esbuild
0.18.20, [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99).
The owner explicitly accepted bounded local D1 use with no esbuild serve or
Drizzle Studio. No overrides, pin substitutions, audit exemptions or force-fixes.
Lockfile comparison found zero changes to existing package versions/integrities.
Acceptance is not release/integration risk disposition.

Changes affect dependency/runtime measurements and the configured Validate job.
Existing validator/test sources, five proposed/advisory controls, AI policies and
live-activation guards remain outside the manifest. Independent human review
must inspect the entire source/SQL/CI/lockfile diff; new tests cannot self-certify
these changes.

### Blocked work and owner prerequisites

- Provide Docker with Linux containers; Compose v2 is needed for the optional
  local development workflow. No system-wide installation was authorized.
- Execute migration replay/failure/concurrency, PostgreSQL constraint/privilege
  checks and real dump/restore; none has passed in this environment.
- Designate an independent human reviewer and disposition remaining dependency
  risk before integration. No reviewer is designated and the gate remains open.
- Obtain separate authority for publication, PR, merge, hosted operations or D2
  and V1-V5. No production data or credentials may be supplied for D1.
- DeepSeek remains **DEFERRED / NO-GO**; draft PR #12 is unchanged and unmerged.
  No workflow/model call, AI credits or autonomous activation.

See [DATABASE_DEVELOPMENT](DATABASE_DEVELOPMENT.md) for exact local prerequisites,
commands, role model, migration review and synthetic recovery/cleanup procedure.

## Stabilization checkpoint - 2026-10-31

**Source:** `verified-source`; remote `main` was freshly fetched and verified at
`bb4602635325be3e878286726f6fc46beee7726a`. Local changes are on
`feature/stabilize-website-r1` in a separate worktree. They are not committed,
pushed, reviewed by an independent human, or integrated. The original worktree
and its unrelated untracked files were left untouched.

**Authority:** the owner approved the bounded test fix, local validation and
related documentation in this stabilization session. That approval does not
activate policy, approve business ADRs, authorize a provider call, or authorize
publication, merge, deployment or production access.

### CI diagnosis and bounded repair

[CI run 41205414184](https://github.com/JOSEPH990108/propertygojb/actions/runs/41205414184)
failed on the verified main SHA in `Test SDLC controls`. Formatting, lint,
typecheck, audit and build were skipped in that run, not passed.

The actual-repository fixture in
[website-r1.test.mjs](../../test/sdlc/website-r1.test.mjs) clones the source
repository with `--no-checkout`, then adds a linked rehearsal worktree. Cloning
still creates the source HEAD's local branch. When source HEAD is `main`, the
clone already owns `main`; the test's `git branch -m main` fails before reaching
the `FEATURE_BRANCH_REQUIRED` denial assertion. A feature-source clone does not
have that collision, explaining the earlier local success.

The fix conditionally renames the inherited `main` to `fixture/source-main`
inside the disposable clone, then performs the original denial test and restores
the rehearsal branch. No force overwrite, ref deletion, assertion removal,
production implementation, policy or runtime-guard change is involved.

Before editing, the focused test passed from a feature source and failed from a
temporary, remote-free `main` source with the same `fatal: a branch named 'main'
already exists` error. After editing, both source contexts passed. The source
clone's `main` still resolved to the original baseline after the test.

### Local validation

All commands ran with Node `v24.14.0` and npm `11.12.0`.

| Command                                                                                         | Actual result                                                                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `node --test --test-name-pattern="real activation stays blocked" test\sdlc\website-r1.test.mjs` | Before fix: feature source 1 passed; main source 1 failed. After fix: both sources 1 passed, 0 failed.                    |
| `npm ci`                                                                                        | Passed after the first focused invocation reported missing `@github/copilot-sdk` in the new worktree; 284 packages added. |
| `node --test test\sdlc\ai-sdlc-verdict.test.mjs`                                                | Passed: 21 tests; local deterministic validation only, no provider call.                                                  |
| `npm run sdlc:validate`                                                                         | Passed: five proposed controls; no approval activated.                                                                    |
| `npm run sdlc:ai-sdlc:validate`                                                                 | Passed: schema/policy self-check; proposed, automatic repair false.                                                       |
| `npm run sdlc:plan:validate`                                                                    | Passed: policy structure valid, live activation blocked.                                                                  |
| `npm run test:sdlc`                                                                             | Passed: 208 passed, 0 failed, 6 skipped, 214 total.                                                                       |
| `npm run format:check`                                                                          | Passed after scoped formatting correction.                                                                                |
| `npm run lint`                                                                                  | Passed with zero warnings.                                                                                                |
| `npm run typecheck`                                                                             | Passed: route generation and TypeScript.                                                                                  |
| `npm audit --audit-level=high`                                                                  | Passed: zero high/critical; 24 moderate findings remain.                                                                  |
| `npm run build`                                                                                 | Passed: Next.js 16.4.2 production build, 3/3 static pages.                                                                |
| `npm run validate`                                                                              | Final complete run passed, exit 0; includes all nine checks above.                                                        |
| `git diff --check`                                                                              | Passed; source/policy/workflow/dependency invariance checked separately.                                                  |

The first full run passed all three validators and the same 208 tests, then
stopped at formatting in four edited documents. It did not run the later gates.
The corrected full rerun passed every gate. Only this handoff's result recording
was updated afterward; formatting is rechecked after that documentation-only edit.

The first formatting command, `npm exec -- prettier --write ...`, was not a
successful write: the PowerShell npm wrapper consumed `--write` and printed
formatted content instead. The retry uses the installed
`.\node_modules\.bin\prettier.cmd --write` on the exact eight changed paths.
The six suite skips are four POSIX mode tests on Windows and two opt-in live-model
tests. No model credentials were enabled; skipped checks are not passing evidence.

The dependency audit currently reports 24 moderate findings, zero high and zero
critical, rooted in
[minimatch globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249)
through the lint toolchain. The high-severity gate is not a zero-vulnerability
claim. No lockfile change or automatic audit fix was made. Dependency remediation
needs its own reviewed scope.

### Separate AI review failure

The latest prototype run remains
[40648708160](https://github.com/JOSEPH990108/propertygojb/actions/runs/40648708160)
at `de8415cb1deb5015a8b95e539c73143600d63efb`, dated 2026-10-28. It is not a run
of the current stabilization branch. Its workflow and verdict schema are
unchanged through the verified main SHA. The provider rejected a JSON Schema;
the publishing job was skipped. See
[the diagnosis and limits](AI_SDLC_DEEPSEEK.md#observed-hosted-failure---2026-10-31).
No credential value was inspected, no key was changed, and no workflow or model
request was dispatched by this session.

### Platform settings and documentation reconciliation

Read-only GitHub API evidence on 2026-10-31:

- `gh api repos/JOSEPH990108/propertygojb/branches/main`: `protected: true`.
- `gh api repos/JOSEPH990108/propertygojb/rules/branches/main`: PR required,
  strict required `Validate` check bound to integration `15368`, resolved review
  threads, and non-fast-forward/deletion restrictions.
- `gh api repos/JOSEPH990108/propertygojb/rulesets/25961783`: active rule
  `Protect main: PR and Validate`, targeting `refs/heads/main`, no bypass actors.
- The rule requires **zero approving reviews** and does not require CODEOWNERS
  or last-push approval. These settings do not establish independent human review.
- `gh pr view 1 --repo JOSEPH990108/propertygojb --json state,mergedAt,mergeCommit,url`:
  PR #1 merged on 2026-10-27 at `37bc2f6acf81782b00eb511d9addd3b5ae12de91`.

This is current platform-enforced configuration evidence, not an adversarial
merge test, retrospective approval evidence or authorization to modify settings.
The old "main unprotected", "no required check", "PR #1 draft", 38-test and
zero-vulnerability statements below describe earlier checkpoints only.

The [feature registry](../product/FEATURE_REGISTRY.md) previously indexed only
the Phase 0 foundation; it omitted the static website and inactive governance
increments. The [decision gates](../architecture/DECISION_GATES.md),
[Phase 1A work item](../work-items/PGJB-P1A-agentic-sdlc.md), and
[lifecycle status](AI_AGENTIC_SDLC.md#current-phase-1a-status) now distinguish
historical evidence from this checkpoint. The
[legacy ledger](MIGRATION_LEDGER.md) concerns the other repository and is not
fresh runtime evidence for this one.

### Boundaries and next action

All R0-R4 controls and website/plan policies remain proposed/advisory.
Real autonomous execution remains compiled-blocked. Model-backed continuation,
OS isolation, signer enrollment, immutable runtime, audit retention/recovery and
activation approval are still separate blockers; synthetic SDK tests cannot
close them. Independent human review and release authority are unresolved.

Owner review of the exact base-to-working-tree diff is required. Only the
governance test setup and informational documents changed: no validator, schema,
workflow, dependency, control status, application code or compiled guard changed.
The test change can affect evidence for branch admission and the required CI
result, so its own passing run is not sufficient independent certification.
Rollback is a reviewed reversal of this bounded patch, not a reset of unrelated
work. Remote CI for the fix remains pending an owner-authorized PR and integration.

The dependency-ordered, **proposed** next work is in the
[first vertical-slice roadmap](../product/FIRST_VERTICAL_SLICE_ROADMAP.md).

## Historical Phase 0 Handoff

**Status at Phase 0 close:** Local Phase 0 execution complete. A1 was subsequently completed; no commit, remote or deployment had yet been created. The Phase 1B update below supersedes same-time statements in this historical record.

## Approved scope

Create a minimal local Next.js foundation, preserve the two approved reference documents, establish engineering rules and run local validation. No database, authentication, business module, customer data or production connection is permitted.

## Toolchain

- Node: 24.14.0
- npm: 11.12.0
- create-next-app / Next.js: 16.4.2
- React / React DOM: 19.3.0
- Git object format: SHA-1, verified after A1 initialization.

## CI npm alignment — 2026-10-18

The official Node.js release metadata shows Node 24.14.0 bundles npm 11.9.0. The repository requires npm `>=11.12.0 <12` and has `engine-strict=true`, while `setup-node` selects Node but does not upgrade npm. The CI workflow now installs npm 11.12.0 explicitly and asserts that exact version before `npm ci`. This keeps the pinned Node version, action SHAs, npm cache, read-only permissions and existing validation/security gates unchanged. The npm package declares support for Node `>=22.9.0`, including Node 24.14.0.

- Local Node/npm: `v24.14.0` / `11.12.0`; exact npm assertion passed.
- `npm ci`: Pass (194 packages installed; zero vulnerabilities).
- `npx prettier --check .github/workflows/ci.yml docs/engineering/HANDOFF.md`: Pass; the workflow YAML parsed and formatting is valid.
- `npm run validate`: Pass (format, lint, typecheck, high-severity audit, production build); audit reported zero vulnerabilities.
- The npm install/assertion was verified locally with the already-approved npm version. The GitHub Actions workflow was subsequently verified by the Phase 1B run recorded below.

## Installed direct dependencies

| Package                                | Version |
| -------------------------------------- | ------: |
| `next`                                 |  16.4.2 |
| `react` / `react-dom`                  |  19.3.0 |
| `@eslint/js`                           |  10.0.1 |
| `@tailwindcss/postcss` / `tailwindcss` |   4.3.3 |
| `@types/node`                          | 24.19.2 |
| `@types/react` / `@types/react-dom`    |  19.3.0 |
| `eslint`                               | 10.13.0 |
| `eslint-plugin-react-hooks`            |   7.1.1 |
| `@eslint-react/eslint-plugin`          |  5.28.1 |
| `postcss`                              |  8.5.30 |
| `prettier`                             |  3.9.10 |
| `typescript`                           |   5.9.3 |
| `typescript-eslint`                    |  8.71.2 |

`npm ls --depth=0` also labels `@emnapi/runtime@1.11.3` and `@img/sharp-wasm32@0.35.5` extraneous. They are optional Sharp platform/WASM packages represented in the lockfile, not direct application dependencies; clean `npm ci`, audit and build passed on Windows.

## Reference integrity

| File                                                      | Original and current local SHA-256                                 | Bytes |
| --------------------------------------------------------- | ------------------------------------------------------------------ | ----: |
| `PROPERTYGOJB_ARCHITECTURE_ERD_PLAN_V1_2026-10-17.md`     | `4cbac60c6371f65ea99d9c8d51d75f3522262c406c594fe3adec2c1ac3d0dea1` | 59690 |
| `PROPERTYGOJB_AGENTIC_REPOSITORY_BLUEPRINT_2026-10-17.md` | `9ae40ef97703c992e0629f7584a8282c58d9cfa3cb684afcc52bbe6fc7825b41` | 26939 |

## Validation evidence

- `node -v`, `npm -v`: Pass (`v24.14.0`, `11.12.0`).
- `npm ci`: Pass after React lint remediation (194 packages added; zero vulnerabilities).
- `npm run format:check`: Pass.
- `npm run lint`: Pass with zero warnings using ESLint 10, `typescript-eslint`, official React Hooks rules and `@eslint-react` TypeScript rules.
- `npm run typecheck`: Pass; Next route types generated and `tsc --noEmit` passed.
- `npm audit --audit-level=high`: Pass; zero vulnerabilities.
- `npm run build`: Pass on Next.js 16.4.2/Turbopack; static `/` and `/_not-found` generated without the initial home-directory root warning.
- `npm run validate`: Pass, running formatting, lint, typecheck, audit and build in sequence.
- Effective Next config loader: Pass; `cacheComponents` is `false`, and `turbopack.root` resolves to this project directory.
- Relative Markdown links: Pass; all eight local links across 11 Markdown files resolve.
- Test suite: `N/A—reason`: Vitest and placeholder tests are deferred until a meaningful vertical slice, as owner-approved in D3.
- Linux `npm ci`, CI workflow execution, branch protection, integration/database tests: not run; GitHub/remote controls remain Phase 1B gates. Git ignore and staging results are recorded in the A1 section below.

## ESLint coverage verification

- `ESLint.calculateConfigForFile("src/app/page.tsx")` confirms `@eslint-react` and `react-hooks` plugins are loaded. `react-hooks/rules-of-hooks` is error; `react-hooks/exhaustive-deps` is warning; `@eslint-react/no-array-index-key` is warning; `@eslint-react/no-missing-key` is error.
- `eslint-plugin-react-hooks@7.1.1` uses its official flat `recommended` preset. `@eslint-react/eslint-plugin@5.28.1` uses `recommended-typescript` for JSX/TSX.
- The presets overlap on nine checks (error boundaries, exhaustive deps, purity, Rules of Hooks, set-state-in-effect, set-state-in-render, static components, unsupported syntax and use-memo). The matching `@eslint-react/*` rules are disabled; the official `react-hooks/*` rules remain enabled at their recommended severities.
- Temporary invalid TSX fixtures, stored outside `src` and removed after the check, produced `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps` and `@eslint-react/no-array-index-key` diagnostics. The React fixture also triggered `@eslint-react/use-state`.
- Core ESLint, TypeScript linting, Prettier and CI validation scripts are unchanged. React/JSX lint uses the maintained `@eslint-react` package rather than `eslint-plugin-react`, whose published peer range does not include ESLint 10.

## Next.js lint gap and dependency findings

- The official `@next/eslint-plugin-next` and `eslint-config-next/core-web-vitals` remain absent. The installed Next 16.4.2 guide documents that Core Web Vitals preset as the source of Next-specific rules and its React/Hooks presets.
- Registry metadata for `@next/eslint-plugin-next@16.4.2` declares `fast-glob@3.3.1`; the vulnerable path continues through `micromatch` to `braces@3.0.3`. A prior audit of that graph reported five high findings (`braces` advisory range `<=3.0.3`). No patched `braces@3.0.4` is available in the registry checked for this review. The plugin was not installed, no override was added, and no packages were downgraded.
- The selected React lint dependencies pass `npm audit --audit-level=high` with zero findings. Reconsider the official Next plugin only after its compatible dependency graph clears the unchanged audit gate. Next-specific rules, including `@next/next/no-img-element` and Core Web Vitals severity upgrades, remain an explicit gap in [decision gates](../architecture/DECISION_GATES.md).
- `eslint-plugin-jsx-a11y` was not added: its current peer range stops at ESLint 9. Dedicated accessibility lint coverage is not claimed by the present React/JSX preset.

## Findings-based secret scan

- Scope: all 26 intended-to-Git files, including both `docs/reference/` documents and `package-lock.json`; excluded generated `node_modules`, `.next`, `next-env.d.ts` and TypeScript build metadata.
- Results: 195 npm SRI hashes and seven long-hex hits. All classified `FP-documented`: lockfile integrity hashes; the verified immutable GitHub Action commit SHAs (one SHA repeats in the handoff); the two reference-file SHA-256 fingerprints; and the legacy source commit SHA (also present in its approved reference). No `TP-secret`, `TP-sensitive` or `NR` findings. No private-key headers, provider-token patterns, JWTs, embedded URL credentials, email, Malaysia phone or MyKad pattern matched.
- The supplied reference documents include public project/source URLs and a public GitHub handle; retained unchanged under the explicit D1 approval.
- Limitations: this is a local regex scan, not proof of absence. It can miss encoded, split or novel secrets; skips binary files; does not establish credential validity or semantic PII; entropy patterns produce false positives/negatives; and there is no Git history to scan. Reports contain only redacted hints and are outside the repository.

## Intended-to-Git file manifest

```text
.gitattributes
.github/copilot-instructions.md
.github/workflows/ci.yml
.gitignore
.node-version
.npmrc
.prettierignore
AGENTS.md
README.md
docs/architecture/DECISION_GATES.md
docs/architecture/adr/ADR-0001-modular-monolith.md
docs/architecture/adr/ADR-0002-single-company-context.md
docs/architecture/adr/ADR-0003-phase-0-toolchain-baseline.md
docs/engineering/HANDOFF.md
docs/engineering/MIGRATION_LEDGER.md
docs/reference/PROPERTYGOJB_AGENTIC_REPOSITORY_BLUEPRINT_2026-10-17.md
docs/reference/PROPERTYGOJB_ARCHITECTURE_ERD_PLAN_V1_2026-10-17.md
eslint.config.mjs
next.config.ts
package-lock.json
package.json
postcss.config.mjs
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
tsconfig.json
```

Generated/ignored local artifacts are `node_modules/`, `.next/`, `next-env.d.ts` and TypeScript build metadata; they are not in the intended-to-Git manifest. The approved scratch scaffold and redacted scan report are outside the workspace.

## A1 completion — 2026-10-18

- Git initialized on `main`; actual object format verified as SHA-1. The effective author identity was verified from existing global configuration; no configuration was changed, and the address is not recorded in repository documentation.
- Exactly the 26 approved Phase 0 manifest paths are staged. No temporary fixtures, environment files, `node_modules`, `.next`, `next-env.d.ts` or TypeScript build metadata are staged. No commit or remote was created.
- Ignore checks passed: `node_modules`, `.next`, `.env`, `.env.local`, `next-env.d.ts` and `*.tsbuildinfo` return ignored; `.env.example`, `AGENTS.md` and the reference documents return not ignored.
- All indexed text uses LF. The references use `-text`, remain byte-identical, and have staged blob IDs `7e35cdf7a960862b99f5611bb9aca6ea898cbb21` and `812f521caace718790bc8b22c7d60c40e80e6087`. Their SHA-256 values and byte lengths match the approved originals in the Reference integrity table.
- The staged findings-based scan found 246 npm integrity hashes and seven long-hex identifiers, all documented false positives. No credential, private key, token, embedded URL credential, email, phone or MyKad pattern matched. The scan is heuristic and has the limitations stated above.
- Before the `.gitattributes` correction, `git diff --cached --check` reported trailing spaces only in the two immutable references' Markdown hard-break lines; non-reference staged files passed. The reference attribute now sets `whitespace=-blank-at-eol` while retaining `-text`, so the full check is expected to ignore only those intentional hard breaks. This must be reverified after restaging.
- A2 commit remains unauthorized and requires separate owner approval of the final staged content and commit message.

The CI workflow pins `actions/checkout` to `11d5960a326750d5838078e36cf38b85af677262` and `actions/setup-node` to `49933ea5288caeca8642d1e84afbd3f7d6820020`, verified from their GitHub `v4` refs on 2026-10-18. At the A1 handoff point the workflow had not run; Phase 1B execution is recorded below.

## Control status

- Advisory: repository instructions exist; no independent review is implied.
- Configured: local lint/format/type/build/audit commands and CI workflow exist.
- Tested: the SDLC registry validator has local positive and negative tests; this does not establish Copilot behavioral adherence or protected CI enforcement.
- Platform-enforced: not established; branch-rule endpoints returned 403, so no protection rule was enabled or verified.

## Open gates

See [decision gates](../architecture/DECISION_GATES.md). Phase 0 completion did not authorize Git initialization, a remote, push, merge, production access or deployment. Later milestones are recorded below.

## Phase 1B GitHub validation — 2026-10-18

- Repository: private `JOSEPH990108/propertygojb`; `main` at `adc2fcf8a2b07c4593640d1dd49390887ff36c54`. The initial push's local and remote SHAs matched.
- GitHub Actions run [39091078883](https://github.com/JOSEPH990108/propertygojb/actions/runs/39091078883), job `Validate`, completed successfully for the npm-alignment commit. The run passed npm 11.12.0 install/assertion, `npm ci`, format, lint, typecheck, high-severity audit and build.
- At that time, branch protection/ruleset endpoints returned 403 with a message requiring GitHub Pro or public visibility. No rule was enabled or verified then. CI was configured and tested, not a required status check.
- The successful run supersedes the earlier Phase 0/A1 statements that the workflow had not yet run and that the A2 commit was unauthorized at that earlier point in time. It does not authorize subsequent pushes, merges, settings changes or deployment.

## Phase 1A local implementation — 2026-10-18

- Base: `adc2fcf8a2b07c4593640d1dd49390887ff36c54`. Draft changes remain uncommitted on `feature/phase-1a-governance-bootstrap`; there is no Phase 1A head SHA or PR.
- `npm run validate`: Pass. The run validated five still-proposed controls, passed all eight SDLC registry tests, format check, lint, typecheck, high-severity audit (zero vulnerabilities) and Next.js production build.
- The preserved draft includes lifecycle/memory/work templates, first-party Copilot agent and skill definitions, PR checklist, control register/schema/validator and CI steps. Their presence does not activate any R0-R4 rule or business ADR. Current P1A-S1 corrections do not modify the S2 register/schema/validator/tests, package files or CI.
- GitHub Actions has not run against these uncommitted changes. Fresh-session customization discovery/diagnostics, independent human review, a PR pilot and merge have not been performed. The successful Phase 1B run above is not evidence for these changes.

## P1A-S1 local corrections — 2026-10-18

- Corrections are on `feature/phase-1a-governance-bootstrap`, based on `adc2fcf8a2b07c4593640d1dd49390887ff36c54`; changes remain uncommitted and unstaged.
- `npm run validate`: pass after S1 corrections. Eight existing SDLC tests passed; formatting, lint, typecheck, high-severity audit (zero vulnerabilities) and Next.js production build passed.
- The separate S2 register/schema/validator/tests, `package.json`, `package-lock.json` and `.github/workflows/ci.yml` were not changed by S1.
- No standalone YAML parser was available without installing a dependency. Prettier formatting passed, but actual Copilot frontmatter discovery/behavior, reviewer diff access and permission behavior remain unverified and are scheduled for P1A-S3.
- No independent human review, PR, GitHub Actions run for these changes, merge, push or deployment occurred. Merge remains separately unauthorized.

## Phase 1A post-push status — 2026-10-22

- **Git state:** `feature/phase-1a-governance-bootstrap`; base `adc2fcf8a2b07c4593640d1dd49390887ff36c54`; head `a0daa43bcd6b79e560e6fcc592e0b31a321b93d4`; commit `chore: add agentic SDLC foundation`. The committed base-to-head scope is 25 paths: 17 S1 paths, 7 S2 paths and 1 CI workflow.
- **Source reviews:** S1 technical source review was accepted. The seven S2 artifacts were technically accepted. These reviews are technical acceptance, not owner authorization for later actions.
- **S3 functional verification:** TEST A/B inspected the declared agent and skill files; live customization discovery and effective runtime permissions were not observable there. Named code-reviewer and security-reviewer delegation returned distinct responses in TEST C and the corrected C-R retest. The S3 record reports explicit loading of all three skills; automatic skill selection was not verified. Earlier TEST C procedural deviations remain part of the record.
- **S3 limits:** Reviewer runtime tool isolation and comprehensive terminal/approval enforcement were **NOT VERIFIED**. Explicit skill activation was verified; automatic selection was **NOT VERIFIED**. AI reviews remain advisory and do not replace human review.
- **Terminal diagnosis:** Git Bash's `node` alias expands to `winpty node.exe`; command substitution detached stdout from the TTY and produced `stdout is not a tty`. Direct executable checks bypassed the alias: `/c/nvm4w/nodejs/node.exe --version` returned `v24.14.0`; `/c/nvm4w/nodejs/npm.cmd --version` returned `11.12.0`. No alias or toolchain change was made.
- **Fresh local validation:** `/c/nvm4w/nodejs/npm.cmd ci` passed (199 packages installed; audit of 200 packages reported zero vulnerabilities). `/c/nvm4w/nodejs/npm.cmd run validate` passed (exit 0), including `npm run sdlc:validate`, `npm run test:sdlc` (38 passed, 0 failed), `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm audit --audit-level=high` (zero vulnerabilities) and `npm run build` (Next.js 16.4.2 production build passed; 3/3 static pages generated). Git status was clean after validation.
- **Remote integration:** No GitHub Actions run has yet been established for this feature commit, and no PR exists. The current conversation-provided owner decision is **PUBLIC FOR NOW**, consistent with GitHub metadata reporting public; no visibility/settings change was performed. A current read-only check found no repository rulesets and no branch protection for `main`, so no required status check or platform-enforced gate is established. The recorded PGJB-CI-01 decision accepts retaining the two CI additions prospectively and was not retrospective authorization.
- **Remaining gates:** Complete owner review of the exact documentation diff; obtain separate PR authorization; establish relevant GitHub CI evidence and independent human review as available; and obtain separate merge authorization. Do not treat technical acceptance, local validation, or the earlier bootstrap decisions as closing these gates. Business ADRs remain open as listed in [decision gates](../architecture/DECISION_GATES.md); no R0-R4 control is activated.
