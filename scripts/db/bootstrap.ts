import { execFileSync } from "node:child_process";
import path from "node:path";
import { createDatabase } from "../../src/db/client";
import {
  DatabaseError,
  POSTGRES_IMAGE,
  databaseMarker,
  databaseName,
  errorCode,
  readDatabaseConfig,
  syntheticPassword,
  type DatabaseConfig,
} from "../../src/db/config";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function docker(args: string[], input?: Buffer): Buffer {
  try {
    return execFileSync("docker", args, {
      input,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    });
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") {
      throw new DatabaseError("DB_DOCKER_UNAVAILABLE", true);
    }
    throw new DatabaseError("DB_DOCKER_COMMAND_FAILED");
  }
}

export function requireDocker(): void {
  try {
    docker(["version", "--format", "{{.Server.Version}}"]);
  } catch {
    throw new DatabaseError("DB_DOCKER_ENGINE_UNAVAILABLE", true);
  }
}

export function validateContainer(
  inspection: unknown,
  config: DatabaseConfig,
): void {
  const item: unknown =
    Array.isArray(inspection) && inspection.length === 1
      ? inspection[0]
      : undefined;
  if (!isRecord(item)) throw new DatabaseError("DB_CONTAINER_UNTRUSTED");
  const settings = item.Config;
  const state = item.State;
  const network = item.NetworkSettings;
  const host = item.HostConfig;
  if (
    item.Id !== config.container ||
    !isRecord(settings) ||
    settings.Image !== POSTGRES_IMAGE ||
    !isRecord(settings.Labels) ||
    settings.Labels["com.propertygojb.d1"] !== "synthetic" ||
    settings.Labels["com.propertygojb.d1.mode"] !== config.mode ||
    settings.Labels["com.propertygojb.d1.instance"] !== config.instance ||
    !Array.isArray(settings.Env) ||
    !settings.Env.includes("POSTGRES_USER=pgjb_bootstrap") ||
    !settings.Env.includes(
      `POSTGRES_PASSWORD=${syntheticPassword("bootstrap")}`,
    ) ||
    !settings.Env.includes(
      `POSTGRES_DB=${databaseName(config.mode, config.instance)}`,
    ) ||
    !isRecord(state) ||
    state.Running !== true ||
    !isRecord(host) ||
    host.Privileged !== false ||
    host.NetworkMode === "host" ||
    !isRecord(host.Tmpfs) ||
    typeof host.Tmpfs["/var/lib/postgresql"] !== "string" ||
    !Array.isArray(item.Mounts) ||
    item.Mounts.some(
      (mount: unknown) => !isRecord(mount) || mount.Type !== "tmpfs",
    ) ||
    !isRecord(network) ||
    !isRecord(network.Ports)
  ) {
    throw new DatabaseError("DB_CONTAINER_UNTRUSTED");
  }
  const ports: unknown = network.Ports["5432/tcp"];
  if (
    !Array.isArray(ports) ||
    ports.length !== 1 ||
    !isRecord(ports[0]) ||
    ports[0].HostIp !== "127.0.0.1" ||
    ports[0].HostPort !== String(config.port)
  ) {
    throw new DatabaseError("DB_CONTAINER_PORT_UNTRUSTED");
  }
}

export function assertContainer(config: DatabaseConfig): void {
  const inspection: unknown = JSON.parse(
    docker(["inspect", "--type", "container", config.container]).toString(
      "utf8",
    ),
  );
  validateContainer(inspection, config);
}

export function identifier(value: string): string {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(value)) {
    throw new DatabaseError("DB_IDENTIFIER_INVALID");
  }
  return `"${value}"`;
}

export async function bootstrap(config: DatabaseConfig): Promise<void> {
  if (config.role !== "bootstrap") {
    throw new DatabaseError("DB_BOOTSTRAP_ROLE_REQUIRED");
  }
  assertContainer(config);
  const connection = createDatabase(config);
  try {
    const client = await connection.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{
        marker: string | null;
        role: string;
        database: string;
      }>(
        `SELECT shobj_description(oid, 'pg_database') AS marker,
           current_user AS role, current_database() AS database
         FROM pg_database WHERE datname = current_database()`,
      );
      const current = result.rows[0];
      if (
        !current ||
        current.role !== config.user ||
        current.database !== config.database ||
        (current.marker !== null && current.marker !== databaseMarker(config))
      ) {
        throw new DatabaseError("DB_BOOTSTRAP_IDENTITY_MISMATCH");
      }
      if (current.marker === null) {
        const schemas = await client.query<{ count: string }>(
          `SELECT count(*)::text AS count FROM pg_namespace
           WHERE nspname NOT LIKE 'pg_%'
           AND nspname NOT IN ('public', 'information_schema')`,
        );
        const tables = await client.query<{ count: string }>(
          `SELECT count(*)::text AS count FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public'`,
        );
        if (schemas.rows[0]?.count !== "0" || tables.rows[0]?.count !== "0") {
          throw new DatabaseError("DB_BOOTSTRAP_NOT_EMPTY");
        }
      }
      for (const role of ["migrator", "runtime"] as const) {
        const name = `pgjb_${role}`;
        const existing = await client.query<{ safe: boolean }>(
          `SELECT rolcanlogin AND NOT rolsuper AND NOT rolcreatedb
             AND NOT rolcreaterole AND NOT rolreplication AND NOT rolbypassrls
             AND NOT rolinherit AS safe
           FROM pg_roles WHERE rolname = $1`,
          [name],
        );
        if (existing.rowCount === 0) {
          await client.query(
            `CREATE ROLE ${identifier(name)} LOGIN PASSWORD '${syntheticPassword(role)}'
             NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS`,
          );
        } else if (existing.rows[0]?.safe !== true) {
          throw new DatabaseError("DB_ROLE_PRIVILEGES_UNTRUSTED");
        }
        const memberships = await client.query<{ count: string }>(
          `SELECT count(*)::text AS count FROM pg_auth_members
           WHERE member = (SELECT oid FROM pg_roles WHERE rolname = $1)`,
          [name],
        );
        if (memberships.rows[0]?.count !== "0") {
          throw new DatabaseError("DB_ROLE_MEMBERSHIP_UNTRUSTED");
        }
      }
      const database = identifier(config.database);
      await client.query(`REVOKE ALL ON DATABASE ${database} FROM PUBLIC`);
      await client.query(
        `REVOKE ALL ON DATABASE ${database} FROM pgjb_migrator, pgjb_runtime`,
      );
      await client.query(
        `GRANT CONNECT, CREATE ON DATABASE ${database} TO pgjb_migrator`,
      );
      await client.query(
        `GRANT CONNECT ON DATABASE ${database} TO pgjb_runtime`,
      );
      await client.query("REVOKE ALL ON SCHEMA public FROM PUBLIC");
      await client.query(
        `COMMENT ON DATABASE ${database} IS '${databaseMarker(config)}'`,
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await connection.close();
  }
}

export function isMain(file: string): boolean {
  return (
    process.argv[1] !== undefined &&
    path.resolve(process.argv[1]) === path.resolve("scripts", "db", file)
  );
}

export async function runCli(
  operation: string,
  work: () => Promise<void>,
): Promise<void> {
  try {
    await work();
    console.log(`[database:${operation}] completed`);
  } catch (error) {
    const blocked = error instanceof DatabaseError && error.blocked;
    console.error(
      `${blocked ? "BLOCKED" : "FAILED"} [database:${operation}] ${errorCode(error)}`,
    );
    process.exitCode = blocked ? 78 : 1;
  }
}

if (isMain("bootstrap.ts")) {
  void runCli("bootstrap", async () => {
    requireDocker();
    await bootstrap(readDatabaseConfig(process.env, "bootstrap"));
  });
}
