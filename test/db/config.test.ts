import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  DatabaseError,
  POSTGRES_IMAGE,
  databaseMarker,
  errorCode,
  readDatabaseConfig,
  syntheticEnvironment,
} from "../../src/db/config";
import { identifier, validateContainer } from "../../scripts/db/bootstrap";
import { generateMigration } from "../../scripts/db/migrate";

const environment = syntheticEnvironment(
  "test",
  "123456781234423482341234567890ab",
  "a".repeat(64),
  55432,
);

test("all roles require explicit local synthetic configuration", () => {
  for (const role of ["bootstrap", "migrator", "runtime"] as const) {
    const config = readDatabaseConfig(environment, role);
    assert.equal(config.user, `pgjb_${role}`);
    assert.equal(config.host, "127.0.0.1");
    assert.equal(config.role, role);
    assert.equal(config.port, 55432);
    assert.ok(Object.isFrozen(config));
    assert.match(databaseMarker(config), /^propertygojb-d1:synthetic:/);
  }
  assert.throws(() => readDatabaseConfig({}), /DB_LOCAL_OR_TEST_ONLY/);
});

test("generation rejects unsafe names and the pinned CLI's zero-exit configuration error", async (t) => {
  assert.throws(
    () => generateMigration("../outside"),
    /DB_MIGRATION_NAME_INVALID/,
  );
  const fixture = await mkdtemp(path.join(os.tmpdir(), "pgjb-d1-generation-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await writeFile(
    path.join(fixture, "drizzle.config.ts"),
    'throw new Error("Synthetic generation failure");\n',
  );
  assert.throws(
    () => generateMigration("synthetic_failure", fixture),
    /DB_GENERATION_FAILED/,
  );
});

for (const [field, value] of [
  ["PGJB_DB_MODE", "production"],
  ["PGJB_DB_MODE", "staging"],
  ["PGJB_DB_INSTANCE", "../outside"],
  ["PGJB_DB_INSTANCE", "a".repeat(33)],
  ["PGJB_DB_CONTAINER", "postgres"],
  ["PGJB_DB_CONTAINER", "--help"],
  ["PGJB_ORGANIZATION_ID", ""],
  ["PGJB_ORGANIZATION_ID", "not-a-uuid"],
] as const) {
  test(`rejects unsafe ${field}: ${value}`, () => {
    assert.throws(
      () => readDatabaseConfig({ ...environment, [field]: value }),
      DatabaseError,
    );
  });
}

test("rejects remote URLs, alternate credentials and connection overrides", () => {
  const valid = environment.DATABASE_URL!;
  const invalid = [
    "",
    "not-a-url",
    ` ${valid}`,
    valid.replace("127.0.0.1", "localhost"),
    valid.replace("127.0.0.1", "db.example.invalid"),
    valid.replace("127.0.0.1", "127.0.0.2"),
    valid.replace("postgresql:", "https:"),
    valid.replace(":55432", ":543"),
    valid.replace(":55432", ""),
    valid.replace("pgjb_synthetic_runtime", "not-a-fixture"),
    valid.replace("pgjb_runtime:", "pgjb_bootstrap:"),
    `${valid}?sslmode=disable`,
    `${valid}?host=db.example.invalid`,
    `${valid}#fragment`,
    valid.replace("/pgjb_test_", "/another_"),
    `${valid}_unexpected`,
  ];
  for (const url of invalid) {
    assert.throws(
      () => readDatabaseConfig({ ...environment, DATABASE_URL: url }),
      DatabaseError,
    );
  }
});

test("only test environments permit the exact restore database", () => {
  const restored = {
    ...environment,
    DATABASE_URL: `${environment.DATABASE_URL}_restore`,
  };
  assert.match(readDatabaseConfig(restored).database, /_restore$/);
  const local = syntheticEnvironment(
    "local",
    "1".repeat(32),
    "a".repeat(64),
    55432,
  );
  assert.throws(
    () =>
      readDatabaseConfig({
        ...local,
        DATABASE_URL: `${local.DATABASE_URL}_restore`,
      }),
    /DB_SYNTHETIC_TARGET_REQUIRED/,
  );
});

function inspection() {
  return [
    {
      Id: environment.PGJB_DB_CONTAINER,
      Config: {
        Image: POSTGRES_IMAGE,
        Labels: {
          "com.propertygojb.d1": "synthetic",
          "com.propertygojb.d1.mode": "test",
          "com.propertygojb.d1.instance": environment.PGJB_DB_INSTANCE,
        },
        Env: [
          "POSTGRES_USER=pgjb_bootstrap",
          "POSTGRES_PASSWORD=pgjb_synthetic_bootstrap",
          `POSTGRES_DB=${readDatabaseConfig(environment).database}`,
        ],
      },
      State: { Running: true },
      HostConfig: {
        Privileged: false,
        NetworkMode: "bridge",
        Tmpfs: { "/var/lib/postgresql": "" },
      },
      Mounts: [{ Type: "tmpfs" }],
      NetworkSettings: {
        Ports: {
          "5432/tcp": [{ HostIp: "127.0.0.1", HostPort: "55432" }],
        },
      },
    },
  ];
}

test("container guard binds image, instance, role, database and loopback port", () => {
  const config = readDatabaseConfig(environment);
  validateContainer(inspection(), config);
  for (const mutate of [
    (value: ReturnType<typeof inspection>) => {
      value[0]!.Id = "b".repeat(64);
    },
    (value: ReturnType<typeof inspection>) => {
      value[0]!.Config.Image = "postgres:latest";
    },
    (value: ReturnType<typeof inspection>) => {
      value[0]!.Config.Labels["com.propertygojb.d1"] = "not-synthetic";
    },
    (value: ReturnType<typeof inspection>) => {
      value[0]!.Config.Env = ["POSTGRES_DB=shared"];
    },
    (value: ReturnType<typeof inspection>) => {
      value[0]!.State.Running = false;
    },
    (value: ReturnType<typeof inspection>) => {
      value[0]!.HostConfig.Privileged = true;
    },
    (value: ReturnType<typeof inspection>) => {
      value[0]!.HostConfig.NetworkMode = "host";
    },
    (value: ReturnType<typeof inspection>) => {
      value[0]!.Mounts = [{ Type: "bind" }];
    },
    (value: ReturnType<typeof inspection>) => {
      value[0]!.NetworkSettings.Ports["5432/tcp"][0]!.HostIp = "0.0.0.0";
    },
    (value: ReturnType<typeof inspection>) => {
      value[0]!.NetworkSettings.Ports["5432/tcp"][0]!.HostPort = "5432";
    },
  ]) {
    const changed = inspection();
    mutate(changed);
    assert.throws(() => validateContainer(changed, config), DatabaseError);
  }
  for (const invalid of [null, {}, [], [null], [inspection(), inspection()]]) {
    assert.throws(() => validateContainer(invalid, config), DatabaseError);
  }
});

test("diagnostics exclude raw connection strings, parameters and messages", () => {
  assert.equal(
    errorCode({ code: "23505", detail: "synthetic private value" }),
    "23505",
  );
  assert.equal(
    errorCode(new Error(environment.DATABASE_URL)),
    "DB_OPERATION_FAILED",
  );
  assert.equal(
    errorCode({ code: environment.DATABASE_URL }),
    "DB_OPERATION_FAILED",
  );
  assert.equal(
    errorCode(new DatabaseError("DB_URL_INVALID")),
    "DB_URL_INVALID",
  );
  assert.throws(
    () => identifier('db"; DROP DATABASE other'),
    /DB_IDENTIFIER_INVALID/,
  );
});
