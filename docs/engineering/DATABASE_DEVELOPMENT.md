# D1 Database Development

**Scope:** [ADR-0005](../architecture/adr/ADR-0005-phase-2-foundation.md), local
synthetic PostgreSQL only. D1 is not authorization for a hosted/production
database, authentication, customer data, deployment or autonomous execution.
**Current execution status:** local PostgreSQL 18.6 integration and recovery
verification passed on owner-installed Docker Desktop with Linux containers.
See [HANDOFF](HANDOFF.md#d1-postgresql-verification---2026-11-01) for exact results,
including the remaining human-review and publication gates. These instructions
are not hosted CI or production evidence.

## Prerequisites

- Node 24.14.0 and npm 11.12.0, then `npm ci` from the reviewed lockfile.
- Owner-installed/configured Docker Desktop or an explicitly approved equivalent
  isolated Docker Engine, using Linux containers, with the Docker Compose plugin for
  optional local development. Installing system software is not delegated.
- No production credentials, data or shared database connections.
- Do not start esbuild serve or Drizzle Studio. Their use is outside the local
  dependency-risk acceptance; the approved Drizzle Kit chain has a moderate
  esbuild advisory. Existing minimatch/lint findings also remain.

## Fast checks without PostgreSQL

On a fresh, private Linux x64 installation, after `npm ci` and before validation,
run `node scripts/sdlc/prepare-esbuild-installation.mjs`. The pinned esbuild
installers create three binary hardlink pairs on Linux/npm; Windows skips this
optimization. The preparation step separates only those exact, version-checked
pairs into independent files with identical bytes and executable modes.

This is installation preparation, not a relaxation of installation admission.
The unchanged integrity guard still rejects hardlinks, special files and escaping
symlinks and detects changed installation bytes. Additional or external aliases,
unexpected versions and layout changes fail closed. Linux descriptor-anchored
operations prevent directory replacement from redirecting a write through a
symlink. Run only in a disposable, quiescent installation before any digest
enrollment; never use it to repair an enrolled runtime or refresh its authority.
On failure, stop and recreate the disposable installation rather than bypassing
checks. Windows does not need this Linux-only preparation.

```powershell
npm run db:check
npm run test:db:unit
npm run format:check
npm run lint
npm run typecheck
npm audit --audit-level=high
npm run build
```

`test:db:unit` checks invalid configuration, diagnostic redaction, container
identity/port denials and pool laziness. It also builds a disposable Next fixture:
the server import must build without database configuration; adding a client
directive must fail specifically at the server-only import. No PostgreSQL or
authentication provider is used. Node server-side scripts/tests use the
`react-server` condition so the actual `server-only` package can be imported;
browser boundary enforcement is separately checked by the real Next build.

The application remains unchanged and does not initialize a database during
module import or build. `npm run validate` preserves all existing gates, then
adds migration-history, database-unit and integration tests. Without Docker it
must end BLOCKED/nonzero, not appear to validate the whole foundation.

## Preferred integration test workflow

In a shell without the optional local-development database variables:

```powershell
docker version
npm run test:db
```

The runner creates its own pinned PostgreSQL container with a random instance
identifier, dynamically assigned loopback port, synthetic credentials, labels
and tmpfs storage. It waits for health, bootstraps isolated roles, applies the
reviewed migration, seeds the synthetic organization, and executes:

- First migration, repeated bootstrap/migration/seed and stable migration journal.
- Exact PostgreSQL 18.6 server version; role attributes, memberships and grants.
- Organization null, UUID, uniqueness, length and formatting constraints.
- Runtime read-only privileges; denied DDL, temporary tables, mutation, journal
  reads and role escalation.
- Trusted organization selection and explicit missing-organization failure.
- Conflicting synthetic seed, migration lock contention, transactional SQL
  failure, changed applied history, connection cleanup and rollback.
- Test-only compound foreign keys; no catalog tables are added to the migration.
- Real `pg_dump` and `pg_restore` with data, constraints, grants and journal checks.
- Twelve concurrent queries through the five-client pool, explicit query-failure
  recovery and zero remaining clients/waiters after shutdown.

Migration-failure assertions require PostgreSQL SQLSTATE `22012` from the injected
division-by-zero statement; an unrelated pre-migration error cannot satisfy that
recovery test.

The runner removes only the exact container ID created by that invocation.
No name-prefix deletion, shared database reset or blanket Docker cleanup exists.
Do not supply an external connection as a workaround. Locally, preset connection
URLs/container IDs are rejected by the integration runner. GitHub CI supplies its
own service ID; that container is checked but left for GitHub to clean up.

Exit 78 with `BLOCKED ... DB_DOCKER_ENGINE_UNAVAILABLE` means PostgreSQL tests
were not executed. Other failures are nonzero; no missing-environment skip or
mocked database can certify integration.

## Optional disposable local development

This is a separate, explicitly synthetic instance, not retained data storage.
Its tmpfs contents are lost when the container stops. Do not use it for real
staff, customer or catalog data.

In PowerShell at the approved worktree root:

```powershell
Copy-Item .env.example .env.local
docker compose --env-file .env.local -f compose.db.yml -p pgjb-d1-local up -d --wait
$env:PGJB_DB_CONTAINER = docker compose --env-file .env.local -f compose.db.yml -p pgjb-d1-local ps -q postgres
npm run db:bootstrap:local
npm run db:migrate:local
npm run db:seed:synthetic
```

Do not overwrite an existing local environment file. Inspect the dedicated
project first if it already exists. If port 55432 is occupied, choose a free
port and update both `PGJB_DB_PORT` and all three synthetic URLs consistently;
never stop an unrelated service.

The container must match the full ID, immutable image, instance/mode labels,
synthetic bootstrap identity, database name and single loopback port. Bootstrap
also requires unprivileged, non-host networking and tmpfs data storage, rejecting
bind/volume mounts. It
also refuses an unmarked nonempty database. Subsequent connections verify the
database marker and current role. These checks protect against accidental
mis-targeting; they are not an OS sandbox or a defense against a malicious Docker
administrator.

The only accepted passwords are explicit synthetic fixture values. Secrets must
never be copied into these URLs. Real hosting/TLS/secrets custody requires a later
approved design; do not relax the local-only URL parser to enable it.

The resolver selects `PGJB_ORGANIZATION_ID` from server configuration. It accepts
no client organization identifier. There is no organization management endpoint,
membership model, user session or tenant selection UI.

To clean up the optional development instance, first verify its exact ID and
labels using `docker inspect`, then remove only that instance. Never use blanket
prune commands. Open a new shell for `npm run test:db`, so development connection
variables cannot be mistaken for a disposable test target.

## Roles and schema

- `pgjb_bootstrap`: synthetic container-local administrator, used only by setup
  and recovery. Never used by application queries.
- `pgjb_migrator`: non-superuser without role/database creation, replication,
  inheritance or RLS bypass. Can connect and create the application/journal
  schemas in the one synthetic database.
- `pgjb_runtime`: non-superuser, CONNECT and application-schema USAGE plus SELECT
  only on organizations. No DDL, TEMP, schema ownership or migration-journal
  access. Future tables do not automatically receive runtime grants.

The initial migration contains only `app.organizations` with UUID identity,
unique validated slug, bounded nonempty display name and timestamp. Drizzle
manages a separate journal. Explicit per-table privilege SQL is hand-reviewed
alongside the generator-produced schema DDL; schema snapshots do not model grants.

## Migration authoring

```powershell
npm run db:generate -- --name=descriptive_change
npm run db:check
```

Use only installed pinned tools. Inspect SQL and metadata before application.
The generation wrapper checks explicit success output and migration history:
the pinned Drizzle CLI was observed to exit zero on some configuration errors.
Such errors must produce a nonzero D1 command result, not false success.
Regenerating an unchanged schema must produce no new migration or metadata
change. Drizzle's history checker is not proof of live database state or complete
SQL correctness.

Never use `drizzle-kit push`, mutate on application startup, or edit applied
migrations. Only the dedicated migration command executes migration files. It
uses a single checked-out client, a session advisory lock, verifies the full
applied timestamp/hash prefix, and invokes the pinned migrator on that client.
The pinned migrator creates its journal schema/table before its transaction;
failure may leave an empty journal, but must not retain business DDL or a success
entry. This is why actual PostgreSQL failure tests are mandatory.

## Recovery rehearsal and rollback

`npm run test:db` includes the recovery test. It:

1. Captures organization rows, constraints and journal from the synthetic source.
2. Runs `pg_dump --format=custom` inside the verified container, retaining the
   binary archive in memory, not in logs or a committed fixture.
3. Creates the exact `_restore` database in that same invocation's test instance;
   initializes its database marker and grants.
4. Runs `pg_restore --exit-on-error --single-transaction`. Cluster roles already
   exist; the dump restores object ownership and table grants.
5. Compares rows, constraint definitions and journal; checks runtime denials and
   no-op migration replay; drops only the database created by that test.

This synthetic rehearsal is not a production RPO/RTO claim. A retained database
would require separately approved backup custody, restore ownership, maintenance
window and verification. SQL down migrations are not invented automatically.

On a failed transactional migration, stop and report the error; do not advance
history. On immutable-history mismatch, preserve the evidence and recover the
approved SQL rather than rewriting the database journal. An invocation-owned
disposable instance may be recreated. Source rollback requires reviewed changes,
preserving unrelated work, never an automatic reset/commit/push.

## CI and approval boundaries

The existing Validate job adds a digest-pinned PostgreSQL service, synthetic
credentials, loopback binding, health checks and mandatory DB tests. Existing
checks and read-only workflow permissions remain; no AI or deployment job is
introduced. Service configuration is not hosted execution evidence.

Before integration: designate an independent human reviewer, inspect the complete
base-to-head diff including SQL/roles/CI/dependency changes, execute all blocked
PostgreSQL tests, disposition dependency findings, and obtain the separate
publication/PR authority. No independent review, merge, deployment, D2/V1-V5 or
production permission is conferred by local tests.

DeepSeek remains DEFERRED / NO-GO and draft PR #12 remains untouched.
