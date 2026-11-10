import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import {
  DatabaseError,
  POSTGRES_IMAGE,
  SYNTHETIC_ORGANIZATION_ID,
  databaseName,
  readDatabaseConfig,
  syntheticEnvironment,
  syntheticPassword,
  type DatabaseEnvironment,
} from "../../src/db/config";
import { createDatabase } from "../../src/db/client";
import {
  assertContainer,
  bootstrap,
  docker,
  isMain,
  isRecord,
  requireDocker,
  runCli,
} from "./bootstrap";
import { runMigrations } from "./migrate";
import { seedSynthetic } from "./seed-synthetic";

function publishedPort(container: string): number {
  const value = docker(["port", container, "5432/tcp"]).toString("utf8").trim();
  const match = /^127\.0\.0\.1:(\d+)$/.exec(value);
  if (!match?.[1]) throw new DatabaseError("DB_TEST_PORT_INVALID");
  return Number(match[1]);
}

async function waitUntilHealthy(container: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const state: unknown = JSON.parse(
      docker(["inspect", "--format", "{{json .State}}", container]).toString(
        "utf8",
      ),
    );
    if (!isRecord(state) || state.Running !== true) {
      throw new DatabaseError("DB_TEST_CONTAINER_STOPPED");
    }
    if (isRecord(state.Health) && state.Health.Status === "healthy") return;
    await delay(1_000);
  }
  throw new DatabaseError("DB_TEST_HEALTH_TIMEOUT");
}

async function verifyPopulatedD1Upgrade(
  migrationConfig: ReturnType<typeof readDatabaseConfig>,
): Promise<void> {
  const migrationFolder = await mkdtemp(
    path.join(os.tmpdir(), "pgjb-d1-upgrade-"),
  );
  try {
    const journalPath = path.resolve("drizzle", "meta", "_journal.json");
    const journal = JSON.parse(await readFile(journalPath, "utf8")) as {
      version: string;
      dialect: string;
      entries: Array<{
        idx: number;
        version: string;
        when: number;
        tag: string;
        breakpoints: boolean;
      }>;
    };
    const d1Migration = journal.entries.find(
      (entry) => entry.tag === "0000_organization_foundation",
    );
    if (!d1Migration || d1Migration.idx !== 0) {
      throw new DatabaseError("DB_D1_MIGRATION_NOT_FOUND");
    }

    await mkdir(path.join(migrationFolder, "meta"));
    await copyFile(
      path.resolve("drizzle", `${d1Migration.tag}.sql`),
      path.join(migrationFolder, `${d1Migration.tag}.sql`),
    );
    await writeFile(
      path.join(migrationFolder, "meta", "_journal.json"),
      `${JSON.stringify({ ...journal, entries: [d1Migration] }, null, 2)}\n`,
    );

    await runMigrations(migrationConfig, migrationFolder);
    await seedSynthetic(migrationConfig);

    const connection = createDatabase(migrationConfig);
    let beforeUpgrade: Array<{
      id: string;
      slug: string;
      display_name: string;
      created_at: string;
    }>;
    try {
      const result = await connection.pool.query<{
        id: string;
        slug: string;
        display_name: string;
        created_at: string;
      }>(
        `
        SELECT id::text, slug, display_name, created_at::text
        FROM app.organizations
        WHERE id = $1
      `,
        [SYNTHETIC_ORGANIZATION_ID],
      );
      if (result.rowCount !== 1) {
        throw new DatabaseError("DB_D1_UPGRADE_FIXTURE_MISSING");
      }
      beforeUpgrade = result.rows;
    } finally {
      await connection.close();
    }

    await runMigrations(migrationConfig);

    const upgraded = createDatabase(migrationConfig);
    try {
      const result = await upgraded.pool.query<{
        id: string;
        slug: string;
        display_name: string;
        created_at: string;
      }>(
        `
        SELECT id::text, slug, display_name, created_at::text
        FROM app.organizations
        WHERE id = $1
      `,
        [SYNTHETIC_ORGANIZATION_ID],
      );
      assert.deepEqual(result.rows, beforeUpgrade);
      console.log("Verified populated D1 upgrade preserves organization data");
    } finally {
      await upgraded.close();
    }
  } finally {
    await rm(migrationFolder, { recursive: true, force: true });
  }
}

export async function runDatabaseTests(): Promise<void> {
  requireDocker();
  let ownedContainer: string | undefined;
  let environment: DatabaseEnvironment;
  const suppliedContainer = process.env.PGJB_DB_CONTAINER;
  if (suppliedContainer) {
    if (
      process.env.GITHUB_ACTIONS !== "true" ||
      process.env.PGJB_DB_MODE !== "test"
    ) {
      throw new DatabaseError("DB_TEST_EXTERNAL_TARGET_DENIED");
    }
    environment = syntheticEnvironment(
      "test",
      process.env.PGJB_DB_INSTANCE ?? "",
      suppliedContainer,
      Number(process.env.PGJB_DB_PORT),
    );
    assertContainer(readDatabaseConfig(environment, "bootstrap"));
  } else {
    if (
      process.env.DATABASE_URL ||
      process.env.BOOTSTRAP_DATABASE_URL ||
      process.env.MIGRATION_DATABASE_URL
    ) {
      throw new DatabaseError("DB_TEST_EXTERNAL_TARGET_DENIED");
    }
    const instance = randomUUID().replaceAll("-", "");
    const name = databaseName("test", instance);
    const container = docker([
      "run",
      "--detach",
      "--label",
      "com.propertygojb.d1=synthetic",
      "--label",
      "com.propertygojb.d1.mode=test",
      "--label",
      `com.propertygojb.d1.instance=${instance}`,
      "--name",
      `pgjb-d1-test-${instance}`,
      "--publish",
      "127.0.0.1::5432",
      "--tmpfs",
      "/var/lib/postgresql",
      "--env",
      "POSTGRES_USER=pgjb_bootstrap",
      "--env",
      `POSTGRES_PASSWORD=${syntheticPassword("bootstrap")}`,
      "--env",
      `POSTGRES_DB=${name}`,
      "--health-cmd",
      `pg_isready -U pgjb_bootstrap -d ${name}`,
      "--health-interval",
      "1s",
      "--health-timeout",
      "3s",
      "--health-retries",
      "60",
      POSTGRES_IMAGE,
    ])
      .toString("utf8")
      .trim();
    if (!/^[a-f0-9]{64}$/.test(container)) {
      throw new DatabaseError("DB_TEST_CONTAINER_ID_INVALID");
    }
    ownedContainer = container;
    // Cleanup ownership comes from this invocation's docker run, not a name.
    try {
      environment = syntheticEnvironment(
        "test",
        instance,
        container,
        publishedPort(container),
      );
    } catch (error) {
      docker(["rm", "--force", container]);
      throw error;
    }
  }
  try {
    const bootstrapConfig = readDatabaseConfig(environment, "bootstrap");
    await waitUntilHealthy(bootstrapConfig.container);
    await bootstrap(bootstrapConfig);
    const migrationConfig = readDatabaseConfig(environment, "migrator");
    await verifyPopulatedD1Upgrade(migrationConfig);
    await seedSynthetic(migrationConfig);
    const result = spawnSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        "tsx",
        "--test",
        "--test-concurrency=1",
        "test/db/foundation.test.ts",
        "test/db/recovery.test.ts",
        "test/db/identity-adapter.test.ts",
        "test/identity/adapter-compat.test.ts",
        "test/identity/admission.test.ts",
        "test/identity/claims.test.ts",
        "test/identity/session-authorization.test.ts",
      ],
      {
        env: {
          ...process.env,
          ...environment,
          PGJB_TEST_REAL_COPILOT: "0",
        },
        stdio: "inherit",
        timeout: 180_000,
        windowsHide: true,
      },
    );
    if (result.error || result.status !== 0) {
      throw new DatabaseError("DB_INTEGRATION_TESTS_FAILED");
    }
  } finally {
    if (ownedContainer) docker(["rm", "--force", ownedContainer]);
  }
}

if (isMain("test.ts")) {
  void runCli("integration-tests", runDatabaseTests);
}
