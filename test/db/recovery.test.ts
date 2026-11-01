import assert from "node:assert/strict";
import { before, test } from "node:test";
import {
  assertContainer,
  bootstrap,
  docker,
  identifier,
} from "../../scripts/db/bootstrap";
import { runMigrations } from "../../scripts/db/migrate";
import { assertDatabaseIdentity, createDatabase } from "../../src/db/client";
import { DatabaseError, readDatabaseConfig } from "../../src/db/config";

const source = readDatabaseConfig(process.env, "bootstrap");

before(() => {
  if (source.mode !== "test") throw new DatabaseError("DB_TEST_ONLY");
  assertContainer(source);
});

test("synthetic pg_dump restores data, grants, constraints and history into a clean database", async () => {
  const restoreName = `${source.database}_restore`;
  const env = {
    ...process.env,
    BOOTSTRAP_DATABASE_URL: `${process.env.BOOTSTRAP_DATABASE_URL}_restore`,
    MIGRATION_DATABASE_URL: `${process.env.MIGRATION_DATABASE_URL}_restore`,
    DATABASE_URL: `${process.env.DATABASE_URL}_restore`,
  };
  const restoredAdmin = readDatabaseConfig(env, "bootstrap");
  const restoredRuntime = readDatabaseConfig(env);
  const restoredMigrator = readDatabaseConfig(env, "migrator");
  const connection = createDatabase(source);
  let created = false;
  try {
    const client = await connection.pool.connect();
    try {
      await assertDatabaseIdentity(client, source);
    } finally {
      client.release();
    }
    const rows = await connection.pool.query(
      "SELECT * FROM app.organizations ORDER BY id",
    );
    const history = await connection.pool.query(
      "SELECT * FROM drizzle.__drizzle_migrations ORDER BY id",
    );
    const constraints = await connection.pool.query(
      `SELECT conname, pg_get_constraintdef(oid) AS definition
       FROM pg_constraint WHERE conrelid = 'app.organizations'::regclass
       ORDER BY conname`,
    );
    const archive = docker([
      "exec",
      "--env",
      `PGPASSWORD=${source.password}`,
      source.container,
      "pg_dump",
      "--host=127.0.0.1",
      `--username=${source.user}`,
      `--dbname=${source.database}`,
      "--format=custom",
    ]);
    assert.equal(archive.subarray(0, 5).toString("ascii"), "PGDMP");
    await connection.pool.query(
      `CREATE DATABASE ${identifier(restoreName)} TEMPLATE template0`,
    );
    created = true;
    await bootstrap(restoredAdmin);
    docker(
      [
        "exec",
        "--interactive",
        "--env",
        `PGPASSWORD=${source.password}`,
        source.container,
        "pg_restore",
        "--host=127.0.0.1",
        `--username=${source.user}`,
        `--dbname=${restoreName}`,
        "--exit-on-error",
        "--single-transaction",
      ],
      archive,
    );
    const restored = createDatabase(restoredMigrator);
    try {
      assert.deepEqual(
        (
          await restored.pool.query(
            "SELECT * FROM app.organizations ORDER BY id",
          )
        ).rows,
        rows.rows,
      );
      assert.deepEqual(
        (
          await restored.pool.query(
            "SELECT * FROM drizzle.__drizzle_migrations ORDER BY id",
          )
        ).rows,
        history.rows,
      );
      assert.deepEqual(
        (
          await restored.pool.query(
            `SELECT conname, pg_get_constraintdef(oid) AS definition
           FROM pg_constraint WHERE conrelid = 'app.organizations'::regclass
           ORDER BY conname`,
          )
        ).rows,
        constraints.rows,
      );
      await runMigrations(restoredMigrator);
      assert.deepEqual(
        (
          await restored.pool.query(
            "SELECT * FROM drizzle.__drizzle_migrations ORDER BY id",
          )
        ).rows,
        history.rows,
      );
    } finally {
      await restored.close();
    }
    const runtime = createDatabase(restoredRuntime);
    try {
      assert.deepEqual(
        (
          await runtime.pool.query(
            "SELECT * FROM app.organizations ORDER BY id",
          )
        ).rows,
        rows.rows,
      );
      await assert.rejects(
        runtime.pool.query("DELETE FROM app.organizations"),
        { code: "42501" },
      );
      await assert.rejects(
        runtime.pool.query("SELECT * FROM drizzle.__drizzle_migrations"),
        { code: "42501" },
      );
    } finally {
      await runtime.close();
    }
  } finally {
    try {
      if (created) {
        assertContainer(source);
        // Only this invocation-created database is eligible for cleanup.
        await connection.pool.query(`DROP DATABASE ${identifier(restoreName)}`);
      }
    } finally {
      await connection.close();
    }
  }
});
