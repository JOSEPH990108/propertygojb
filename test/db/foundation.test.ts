import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { before, test } from "node:test";
import { assertContainer, bootstrap } from "../../scripts/db/bootstrap";
import { MIGRATION_LOCK, runMigrations } from "../../scripts/db/migrate";
import { seedSynthetic } from "../../scripts/db/seed-synthetic";
import {
  assertDatabaseIdentity,
  closeDatabase,
  createDatabase,
} from "../../src/db/client";
import {
  DatabaseError,
  SYNTHETIC_ORGANIZATION_ID,
  errorCode,
  readDatabaseConfig,
} from "../../src/db/config";
import { getOrganization } from "../../src/modules/organization";

const runtime = readDatabaseConfig();
const migrator = readDatabaseConfig(process.env, "migrator");
const admin = readDatabaseConfig(process.env, "bootstrap");

before(() => {
  if (runtime.mode !== "test") throw new DatabaseError("DB_TEST_ONLY");
  assertContainer(admin);
});

test("bootstrap, migration replay and synthetic seed are idempotent", async () => {
  const connection = createDatabase(migrator);
  try {
    const version = await connection.pool.query<{ server_version_num: string }>(
      "SHOW server_version_num",
    );
    assert.equal(version.rows[0]?.server_version_num, "180006");
    console.log("Verified PostgreSQL server_version_num=180006 (18.6)");
    const before = await connection.pool.query(
      "SELECT * FROM drizzle.__drizzle_migrations ORDER BY id",
    );
    assert.equal(before.rowCount, 1);
    await bootstrap(admin);
    await runMigrations(migrator);
    await runMigrations(migrator);
    await seedSynthetic(migrator);
    await seedSynthetic(migrator);
    const after = await connection.pool.query(
      "SELECT * FROM drizzle.__drizzle_migrations ORDER BY id",
    );
    assert.deepEqual(after.rows, before.rows);
    const tables = await connection.pool.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'app' ORDER BY tablename",
    );
    assert.deepEqual(tables.rows, [{ tablename: "organizations" }]);
    const rows = await connection.pool.query(
      "SELECT id FROM app.organizations",
    );
    assert.deepEqual(rows.rows, [{ id: SYNTHETIC_ORGANIZATION_ID }]);
  } finally {
    await connection.close();
  }
});

test("PostgreSQL enforces organization null, unique, format and length constraints", async () => {
  const connection = createDatabase(migrator);
  try {
    const cases: Array<{
      id: string | null;
      slug: string | null;
      name: string | null;
      code: string;
    }> = [
      { id: null, slug: "valid", name: "Synthetic", code: "23502" },
      { id: randomUUID(), slug: null, name: "Synthetic", code: "23502" },
      { id: randomUUID(), slug: "valid", name: null, code: "23502" },
      { id: "invalid", slug: "valid", name: "Synthetic", code: "22P02" },
      {
        id: randomUUID(),
        slug: "synthetic-propertygojb",
        name: "Synthetic",
        code: "23505",
      },
      {
        id: SYNTHETIC_ORGANIZATION_ID,
        slug: "other",
        name: "Synthetic",
        code: "23505",
      },
      { id: randomUUID(), slug: "", name: "Synthetic", code: "23514" },
      {
        id: randomUUID(),
        slug: "Upper Case",
        name: "Synthetic",
        code: "23514",
      },
      {
        id: randomUUID(),
        slug: "a".repeat(81),
        name: "Synthetic",
        code: "22001",
      },
      { id: randomUUID(), slug: "valid", name: "", code: "23514" },
      { id: randomUUID(), slug: "valid", name: " padded ", code: "23514" },
      { id: randomUUID(), slug: "valid", name: "a".repeat(161), code: "22001" },
    ];
    for (const fixture of cases) {
      await assert.rejects(
        connection.pool.query(
          "INSERT INTO app.organizations (id, slug, display_name) VALUES ($1, $2, $3)",
          [fixture.id, fixture.slug, fixture.name],
        ),
        { code: fixture.code },
      );
    }
    const count = await connection.pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM app.organizations",
    );
    assert.equal(count.rows[0]?.count, "1");
  } finally {
    await connection.close();
  }
});

test("runtime can read organizations but cannot mutate, migrate or assume privileges", async () => {
  const connection = createDatabase(runtime);
  try {
    assert.equal(
      (await connection.pool.query("SELECT id FROM app.organizations"))
        .rowCount,
      1,
    );
    for (const sql of [
      "CREATE SCHEMA forbidden",
      "CREATE TABLE app.forbidden (id integer)",
      "CREATE TEMP TABLE forbidden (id integer)",
      "INSERT INTO app.organizations (slug, display_name) VALUES ('forbidden', 'Synthetic')",
      "UPDATE app.organizations SET display_name = 'Forbidden'",
      "DELETE FROM app.organizations",
      "SELECT * FROM drizzle.__drizzle_migrations",
      "SET ROLE pgjb_migrator",
      "SET ROLE pgjb_bootstrap",
    ]) {
      await assert.rejects(connection.pool.query(sql), { code: "42501" });
    }
    await assert.rejects(runMigrations(runtime), /DB_MIGRATOR_ROLE_REQUIRED/);
    await assert.rejects(bootstrap(runtime), /DB_BOOTSTRAP_ROLE_REQUIRED/);
    await assert.rejects(seedSynthetic(runtime), /DB_SYNTHETIC_SEED_ONLY/);
  } finally {
    await connection.close();
  }
});

test("migration and runtime roles retain nonprivileged attributes and isolated database grants", async () => {
  const connection = createDatabase(admin);
  try {
    const roles = await connection.pool.query<{
      rolname: string;
      safe: boolean;
      can_create: boolean;
      can_temp: boolean;
    }>(
      `SELECT rolname,
         rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole
         AND NOT rolinherit AND NOT rolreplication AND NOT rolbypassrls AS safe,
         has_database_privilege(rolname, current_database(), 'CREATE') AS can_create,
         has_database_privilege(rolname, current_database(), 'TEMP') AS can_temp
       FROM pg_roles WHERE rolname IN ('pgjb_migrator', 'pgjb_runtime')
       ORDER BY rolname`,
    );
    assert.deepEqual(roles.rows, [
      {
        rolname: "pgjb_migrator",
        safe: true,
        can_create: true,
        can_temp: false,
      },
      {
        rolname: "pgjb_runtime",
        safe: true,
        can_create: false,
        can_temp: false,
      },
    ]);
    const memberships = await connection.pool.query(
      `SELECT 1 FROM pg_auth_members WHERE member IN
       (SELECT oid FROM pg_roles WHERE rolname IN ('pgjb_migrator', 'pgjb_runtime'))`,
    );
    assert.equal(memberships.rowCount, 0);
  } finally {
    await connection.close();
  }
  const migrationConnection = createDatabase(migrator);
  try {
    await assert.rejects(
      migrationConnection.pool.query("SET ROLE pgjb_bootstrap"),
      { code: "42501" },
    );
    await assert.rejects(
      migrationConnection.pool.query("CREATE ROLE pgjb_forbidden NOLOGIN"),
      { code: "42501" },
    );
  } finally {
    await migrationConnection.close();
  }
});

test("pool limits concurrent clients, recovers from query failure and closes every connection", async () => {
  const connection = createDatabase(runtime);
  try {
    await Promise.all(
      Array.from({ length: 12 }, () =>
        connection.pool.query("SELECT pg_sleep(0.02)"),
      ),
    );
    assert.equal(connection.pool.totalCount, 5);
    assert.equal(connection.pool.idleCount, 5);
    assert.equal(connection.pool.waitingCount, 0);
    await assert.rejects(connection.pool.query("SELECT 1 / 0"), {
      code: "22012",
    });
    assert.equal(
      (await connection.pool.query("SELECT id FROM app.organizations"))
        .rowCount,
      1,
    );
  } finally {
    await connection.close();
  }
  assert.equal(connection.pool.totalCount, 0);
  assert.equal(connection.pool.idleCount, 0);
  assert.equal(connection.pool.waitingCount, 0);
});

test("organization context is server-selected and missing context fails explicitly", async () => {
  try {
    const organization = await getOrganization();
    assert.deepEqual(organization, {
      id: SYNTHETIC_ORGANIZATION_ID,
      slug: "synthetic-propertygojb",
      displayName: "Synthetic PropertyGOJB",
    });
    process.env.PGJB_ORGANIZATION_ID = randomUUID();
    await assert.rejects(getOrganization(), /ORGANIZATION_NOT_CONFIGURED/);
  } finally {
    process.env.PGJB_ORGANIZATION_ID = SYNTHETIC_ORGANIZATION_ID;
    await closeDatabase();
  }
});

test("a changed synthetic seed cannot silently overwrite an existing organization", async () => {
  const connection = createDatabase(migrator);
  try {
    await connection.pool.query(
      "UPDATE app.organizations SET display_name = 'Synthetic conflict' WHERE id = $1",
      [SYNTHETIC_ORGANIZATION_ID],
    );
    await assert.rejects(seedSynthetic(migrator), /DB_SYNTHETIC_SEED_CONFLICT/);
  } finally {
    try {
      await connection.pool.query(
        "UPDATE app.organizations SET display_name = 'Synthetic PropertyGOJB' WHERE id = $1",
        [SYNTHETIC_ORGANIZATION_ID],
      );
    } finally {
      await connection.close();
    }
  }
});

test("same-session advisory locking rejects concurrent migration entry", async () => {
  const connection = createDatabase(migrator);
  const client = await connection.pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK]);
    await assert.rejects(runMigrations(migrator), /DB_MIGRATION_BUSY/);
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK]);
    } finally {
      client.release();
      await connection.close();
    }
  }
  await runMigrations(migrator);
});

test("failed migration rolls back business DDL and does not advance history", async (t) => {
  const folder = await mkdtemp(path.join(os.tmpdir(), "pgjb-d1-failure-"));
  t.after(() => rm(folder, { recursive: true, force: true }));
  await cp(path.resolve("drizzle"), folder, { recursive: true });
  const journalFile = path.join(folder, "meta", "_journal.json");
  const journal: {
    entries: Array<{
      idx: number;
      version: string;
      when: number;
      tag: string;
      breakpoints: boolean;
    }>;
  } = JSON.parse(await readFile(journalFile, "utf8"));
  const previous = journal.entries.at(-1);
  assert.ok(previous);
  journal.entries.push({
    idx: previous.idx + 1,
    version: previous.version,
    when: previous.when + 1,
    tag: "0001_failure_probe",
    breakpoints: true,
  });
  await writeFile(journalFile, JSON.stringify(journal));
  await writeFile(
    path.join(folder, "0001_failure_probe.sql"),
    "CREATE TABLE app.rollback_probe (id integer);\n--> statement-breakpoint\nSELECT 1 / 0;\n",
  );
  await assert.rejects(runMigrations(migrator, folder), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal(errorCode(error.cause), "22012");
    return true;
  });
  const connection = createDatabase(migrator);
  try {
    const history = await connection.pool.query(
      "SELECT * FROM drizzle.__drizzle_migrations",
    );
    assert.equal(history.rowCount, 1);
    const relation = await connection.pool.query<{ relation: string | null }>(
      "SELECT to_regclass('app.rollback_probe')::text AS relation",
    );
    assert.equal(relation.rows[0]?.relation, null);
    await runMigrations(migrator);
  } finally {
    await connection.close();
  }
});

test("editing already-applied migration SQL is rejected", async (t) => {
  const folder = await mkdtemp(path.join(os.tmpdir(), "pgjb-d1-history-"));
  t.after(() => rm(folder, { recursive: true, force: true }));
  await cp(path.resolve("drizzle"), folder, { recursive: true });
  await writeFile(
    path.join(folder, "0000_organization_foundation.sql"),
    "SELECT 1;\n",
  );
  await assert.rejects(
    runMigrations(migrator, folder),
    /DB_MIGRATION_HISTORY_MISMATCH/,
  );
});

test("database markers are verified and transaction rollback leaves no partial row", async () => {
  const connection = createDatabase(migrator);
  const client = await connection.pool.connect();
  try {
    await assertDatabaseIdentity(client, migrator);
    await assert.rejects(
      assertDatabaseIdentity(client, { ...migrator, instance: "f".repeat(32) }),
      /DB_IDENTITY_MISMATCH/,
    );
    const id = randomUUID();
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO app.organizations (id, slug, display_name) VALUES ($1, 'rollback', 'Synthetic')",
      [id],
    );
    await assert.rejects(client.query("SELECT 1 / 0"), { code: "22012" });
    await client.query("ROLLBACK");
    assert.equal(
      (
        await client.query("SELECT id FROM app.organizations WHERE id = $1", [
          id,
        ])
      ).rowCount,
      0,
    );
  } finally {
    client.release();
    await connection.close();
  }
  assert.equal(connection.pool.totalCount, 0);
});

test("test-only compound foreign keys reject cross-organization/project links", async () => {
  const connection = createDatabase(admin);
  const client = await connection.pool.connect();
  try {
    await client.query(
      `CREATE TEMP TABLE ownership_projects (
         organization_id integer NOT NULL, id integer NOT NULL,
         PRIMARY KEY (organization_id, id)
       );
       CREATE TEMP TABLE ownership_layouts (
         organization_id integer NOT NULL, project_id integer NOT NULL,
         id integer NOT NULL,
         PRIMARY KEY (organization_id, project_id, id),
         FOREIGN KEY (organization_id, project_id)
           REFERENCES ownership_projects (organization_id, id)
       );
       INSERT INTO ownership_projects VALUES (1, 1), (2, 2);`,
    );
    await client.query("INSERT INTO ownership_layouts VALUES (1, 1, 1)");
    await assert.rejects(
      client.query("INSERT INTO ownership_layouts VALUES (2, 1, 2)"),
      { code: "23503" },
    );
    await assert.rejects(
      client.query("INSERT INTO ownership_layouts VALUES (1, 2, 3)"),
      { code: "23503" },
    );
  } finally {
    client.release();
    await connection.close();
  }
});
