import { spawnSync } from "node:child_process";
import path from "node:path";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { assertDatabaseIdentity, createDatabase } from "../../src/db/client";
import {
  DatabaseError,
  readDatabaseConfig,
  type DatabaseConfig,
} from "../../src/db/config";
import { assertContainer, isMain, requireDocker, runCli } from "./bootstrap";

export const MIGRATION_LOCK = 1_734_011_001;

export function generateMigration(
  name?: string,
  workingDirectory = process.cwd(),
): void {
  if (name !== undefined && !/^[a-z][a-z0-9_]{0,63}$/.test(name)) {
    throw new DatabaseError("DB_MIGRATION_NAME_INVALID");
  }
  const tool = path.resolve("node_modules", "drizzle-kit", "bin.cjs");
  const generated = spawnSync(
    process.execPath,
    [tool, "generate", ...(name ? [`--name=${name}`] : [])],
    { cwd: workingDirectory, encoding: "utf8", timeout: 30_000 },
  );
  // This pinned CLI can exit zero on errors; require its explicit success output.
  if (
    generated.error ||
    generated.status !== 0 ||
    !/No schema changes, nothing to migrate|Your SQL migration file/.test(
      generated.stdout,
    )
  ) {
    throw new DatabaseError("DB_GENERATION_FAILED");
  }
  const migrationsFolder = path.join(workingDirectory, "drizzle");
  if (readMigrationFiles({ migrationsFolder }).length === 0) {
    throw new DatabaseError("DB_GENERATION_EMPTY");
  }
  const checked = spawnSync(process.execPath, [tool, "check"], {
    cwd: workingDirectory,
    encoding: "utf8",
    timeout: 30_000,
  });
  if (checked.error || checked.status !== 0) {
    throw new DatabaseError("DB_GENERATION_HISTORY_INVALID");
  }
  process.stdout.write(generated.stdout);
}

export async function runMigrations(
  config: DatabaseConfig,
  migrationsFolder = path.resolve("drizzle"),
): Promise<void> {
  if (config.role !== "migrator") {
    throw new DatabaseError("DB_MIGRATOR_ROLE_REQUIRED");
  }
  assertContainer(config);
  const migrations = readMigrationFiles({ migrationsFolder });
  if (
    migrations.length === 0 ||
    migrations.some(
      (migration, index) =>
        !Number.isSafeInteger(migration.folderMillis) ||
        migration.folderMillis <= 0 ||
        (index > 0 &&
          migration.folderMillis <= migrations[index - 1]!.folderMillis),
    )
  ) {
    throw new DatabaseError("DB_MIGRATION_HISTORY_INVALID");
  }
  const connection = createDatabase(config);
  try {
    const client = await connection.pool.connect();
    let locked = false;
    try {
      await assertDatabaseIdentity(client, config);
      const lock = await client.query<{ acquired: boolean }>(
        "SELECT pg_try_advisory_lock($1) AS acquired",
        [MIGRATION_LOCK],
      );
      locked = lock.rows[0]?.acquired === true;
      if (!locked) throw new DatabaseError("DB_MIGRATION_BUSY");
      const table = await client.query<{ relation: string | null }>(
        "SELECT to_regclass('drizzle.__drizzle_migrations')::text AS relation",
      );
      if (table.rows[0]?.relation) {
        const history = await client.query<{
          hash: string;
          created_at: string;
        }>(
          "SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at, id",
        );
        for (const [index, applied] of history.rows.entries()) {
          const expected = migrations[index];
          if (
            !expected ||
            applied.hash !== expected.hash ||
            Number(applied.created_at) !== expected.folderMillis
          ) {
            throw new DatabaseError("DB_MIGRATION_HISTORY_MISMATCH");
          }
        }
      }
      await migrate(drizzle(client), {
        migrationsFolder,
        migrationsSchema: "drizzle",
        migrationsTable: "__drizzle_migrations",
      });
    } finally {
      try {
        if (locked) {
          await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK]);
        }
      } finally {
        client.release();
      }
    }
  } finally {
    await connection.close();
  }
}

if (isMain("migrate.ts")) {
  const args = process.argv.slice(2);
  if (args[0] === "--generate") {
    void runCli("generate", async () => {
      if (
        args.length > 2 ||
        (args[1] !== undefined && !args[1].startsWith("--name="))
      ) {
        throw new DatabaseError("DB_GENERATION_ARGUMENTS_INVALID");
      }
      generateMigration(args[1]?.slice("--name=".length));
    });
  } else {
    void runCli("migrate", async () => {
      if (args.length !== 0)
        throw new DatabaseError("DB_MIGRATION_ARGUMENTS_INVALID");
      requireDocker();
      await runMigrations(readDatabaseConfig(process.env, "migrator"));
    });
  }
}
