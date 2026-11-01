import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import {
  DatabaseError,
  POSTGRES_IMAGE,
  databaseName,
  readDatabaseConfig,
  syntheticEnvironment,
  syntheticPassword,
  type DatabaseEnvironment,
} from "../../src/db/config";
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
    await runMigrations(migrationConfig);
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
